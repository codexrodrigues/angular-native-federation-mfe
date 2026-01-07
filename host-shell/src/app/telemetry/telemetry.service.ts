import { Inject, Injectable, InjectionToken, Optional } from '@angular/core';

type TelemetryData = Record<string, unknown>;
type TelemetryLevel = 'info' | 'warn' | 'error';

export type TelemetryEvent = {
  name: string;
  level: TelemetryLevel;
  timestamp: number;
  data?: TelemetryData;
  durationMs?: number;
};

export type TelemetryReporter = {
  report: (event: TelemetryEvent) => void;
};

export const HOST_SHELL_TELEMETRY = new InjectionToken<TelemetryReporter>('HOST_SHELL_TELEMETRY');

declare global {
  interface Window {
    __HOST_SHELL_TELEMETRY__?: TelemetryReporter;
  }
}

const resolveGlobalReporter = (): TelemetryReporter | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const reporter = window.__HOST_SHELL_TELEMETRY__;
  if (!reporter || typeof reporter.report !== 'function') {
    return null;
  }

  return reporter;
};

@Injectable({ providedIn: 'root' })
export class TelemetryService {
  private readonly reporter: TelemetryReporter | null;

  constructor(
    @Optional() @Inject(HOST_SHELL_TELEMETRY) reporter?: TelemetryReporter | null
  ) {
    this.reporter = reporter ?? resolveGlobalReporter();
  }

  info(name: string, data?: TelemetryData): void {
    this.emit('info', name, data);
  }

  warn(name: string, data?: TelemetryData): void {
    this.emit('warn', name, data);
  }

  error(name: string, data?: TelemetryData): void {
    this.emit('error', name, data);
  }

  timing(name: string, durationMs: number, data?: TelemetryData): void {
    this.emit('info', name, data, durationMs);
  }

  private emit(
    level: TelemetryLevel,
    name: string,
    data?: TelemetryData,
    durationMs?: number
  ): void {
    const event: TelemetryEvent = {
      name,
      level,
      timestamp: Date.now(),
      data,
      durationMs
    };

    if (this.reporter) {
      this.reporter.report(event);
    }

    this.logToConsole(event);
  }

  private logToConsole(event: TelemetryEvent): void {
    const payload = event.data ?? undefined;
    const label = `[telemetry] ${event.name}`;

    switch (event.level) {
      case 'warn':
        if (payload) {
          console.warn(label, payload);
          return;
        }
        console.warn(label);
        return;
      case 'error':
        if (payload) {
          console.error(label, payload);
          return;
        }
        console.error(label);
        return;
      default:
        if (payload) {
          console.log(label, payload);
          return;
        }
        console.log(label);
    }
  }
}
