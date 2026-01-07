import { Injectable } from '@angular/core';
import { ReportingService } from 'shared-logic/core';

@Injectable({ providedIn: 'root' })
export class CorporateReportingService extends ReportingService {
  override print(data: any): void {
    console.log('--- CORPORATE REPORTING SERVICE ---');
    console.log('Printing data:', data);
    alert(`Corporate Reporting Service:
Printing data: ${JSON.stringify(data, null, 2)}`);
    // In a real app, this might generate a PDF or open a print dialog
    // window.print();
  }
}
