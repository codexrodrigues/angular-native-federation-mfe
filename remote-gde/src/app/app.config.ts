import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { ReportingService } from 'shared-logic/core';

// Stub service for standalone execution
class StandaloneReportingService extends ReportingService {
  override print(data: any): void {
    console.log('[Standalone] Printing:', data);
    alert('[Standalone] Printing report: ' + JSON.stringify(data));
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideAnimations(),
    { provide: ReportingService, useClass: StandaloneReportingService }
  ]
};
