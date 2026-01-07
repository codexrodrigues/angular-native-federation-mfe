import { ApplicationConfig, DEFAULT_CURRENCY_CODE, LOCALE_ID, provideZonelessChangeDetection } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import localePt from '@angular/common/locales/pt';

import { routes } from './app.routes';
import { DrawerService, ReportingService } from 'shared-logic/core';
import { SHELL_API } from 'shared-logic/angular';
import { CorporateReportingService } from './corporate-reporting.service';
import { HostDrawerService } from './drawer/host-drawer.service';
import { ShellApiService } from './shell-api/shell-api.service';
import { HOST_SHELL_TELEMETRY, TelemetryEvent, TelemetryReporter } from './telemetry/telemetry.service';
import { getRuntimeConfig } from './runtime-config';

registerLocaleData(localePt, 'pt-BR');

const createTelemetryReporter = (): TelemetryReporter | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const config = getRuntimeConfig();
  const telemetryUrl = config.telemetryUrl?.trim();
  if (!telemetryUrl) {
    return null;
  }

  const sampleRate =
    typeof config.telemetrySampleRate === 'number' && Number.isFinite(config.telemetrySampleRate)
      ? Math.min(1, Math.max(0, config.telemetrySampleRate))
      : 1;

  const sendPayload = (event: TelemetryEvent) => {
    if (sampleRate < 1 && Math.random() > sampleRate) {
      return;
    }

    const payload = JSON.stringify(event);

    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator && typeof Blob !== 'undefined') {
      try {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(telemetryUrl, blob);
        return;
      } catch {
        // Fall back to fetch if beacon fails
      }
    }

    if (typeof fetch !== 'undefined') {
      void fetch(telemetryUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(() => undefined);
    }
  };

  return { report: sendPayload };
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'BRL' },
    { provide: ReportingService, useClass: CorporateReportingService },
    { provide: DrawerService, useExisting: HostDrawerService },
    { provide: SHELL_API, useClass: ShellApiService },
    { provide: HOST_SHELL_TELEMETRY, useFactory: createTelemetryReporter }
  ]
};
