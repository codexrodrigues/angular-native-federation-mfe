import { Component, Input, Output, EventEmitter, signal, computed, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'lib-corporate-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule],
  template: `
    <div class="corporate-table">
      <table mat-table [dataSource]="displayedData()" class="mfe-grid">
        <ng-container *ngFor="let col of columns" [matColumnDef]="col">
          <th mat-header-cell *matHeaderCellDef>{{ col }}</th>
          <td mat-cell *matCellDef="let row">{{ row[col] }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr
          mat-row
          *matRowDef="let row; columns: columns"
          (click)="rowClick.emit(row)"
        ></tr>
      </table>

      <div class="corporate-table__footer" *ngIf="pagination && totalPages() > 1">
        <span class="page-info">
          Página {{ currentPage() }} de {{ totalPages() }}
        </span>
        <div class="pagination-controls">
          <button
            mat-stroked-button
            color="primary"
            type="button"
            [disabled]="currentPage() === 1"
            (click)="changePage(currentPage() - 1)"
          >
            Anterior
          </button>
          <button
            mat-stroked-button
            color="primary"
            type="button"
            [disabled]="currentPage() === totalPages()"
            (click)="changePage(currentPage() + 1)"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }

      .corporate-table {
        width: 100%;
        border-radius: 12px;
        border: 1px solid var(--mfe-border, #e5e9ef);
        background-color: var(--mfe-surface, #ffffff);
        overflow: hidden;
      }

      .corporate-table table {
        width: 100%;
      }

      .corporate-table__footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--mfe-space-2, 8px) var(--mfe-space-3, 12px);
        background-color: var(--mfe-surface, #ffffff);
        border-top: 1px solid var(--mfe-border, #e5e9ef);
      }

      .page-info {
        font-size: 0.875rem;
        color: var(--mfe-text-muted, #51606a);
      }

      .pagination-controls {
        display: flex;
        gap: var(--mfe-space-2, 8px);
      }
    `
  ]
})
export class CorporateTableComponent implements OnChanges {
  @Input() columns: string[] = [];
  @Input() data: any[] = [];
  @Input() pagination: boolean = true;
  @Input() pageSize: number = 5;
  @Output() rowClick = new EventEmitter<any>();

  currentPage = signal(1);
  private dataSignal = signal<any[]>([]);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      this.dataSignal.set(changes['data'].currentValue || []);
      this.currentPage.set(1);
    }
  }

  totalPages = computed(() => {
    const total = this.dataSignal().length;
    const size = this.pageSize;
    return size > 0 ? Math.ceil(total / size) : 0;
  });

  displayedData = computed(() => {
    const allData = this.dataSignal();
    if (!this.pagination) return allData;
    
    const page = this.currentPage();
    const size = this.pageSize;
    const start = (page - 1) * size;
    return allData.slice(start, start + size);
  });

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }
}
