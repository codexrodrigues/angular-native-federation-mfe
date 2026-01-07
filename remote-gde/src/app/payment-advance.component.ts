import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

interface AdvanceItem {
  id: number;
  fornecedor: string;
  valor: string;
  data: string;
  situacao: string;
}

type AdvanceForm = {
  fornecedor: string;
  valor: number | null;
  data: Date | null;
  situacao: string;
};

type AdvanceFormErrors = {
  fornecedor?: string;
  valor?: string;
  data?: string;
};

type AdvanceDialogData = {
  statusOptions: string[];
};

@Component({
  selector: 'app-payment-advance',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatPaginatorModule,
    MatTableModule
  ],
  template: `
    <section class="gde-screen">
      <header class="screen-header">
        <div>
          <p class="eyebrow">Gestao empresarial</p>
          <h2>Adiantamento de pagamento</h2>
          <p>Pesquise adiantamentos e acompanhe a compensacao.</p>
        </div>
        <div class="screen-actions">
          <button mat-stroked-button color="primary" type="button" (click)="exportAdvances()">Exportar</button>
          <button mat-raised-button color="primary" type="button" (click)="openAdvanceDialog()">
            Novo adiantamento
          </button>
        </div>
      </header>

      <div class="screen-card">
        <div class="filter-row">
          <span class="filter-label">Situacao</span>
          <span class="filter-chip active">Todos</span>
          <span class="filter-chip">Compensado</span>
          <span class="filter-chip">Aguardando</span>
          <span class="filter-chip">Cancelado</span>
        </div>

        <table mat-table [dataSource]="dataSource" class="mfe-grid">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let row">{{ row.id }}</td>
          </ng-container>

          <ng-container matColumnDef="fornecedor">
            <th mat-header-cell *matHeaderCellDef>Fornecedor</th>
            <td mat-cell *matCellDef="let row">{{ row.fornecedor }}</td>
          </ng-container>

          <ng-container matColumnDef="valor">
            <th mat-header-cell *matHeaderCellDef>Valor</th>
            <td mat-cell *matCellDef="let row">
              <span class="mfe-badge mfe-badge--primary">{{ row.valor }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="data">
            <th mat-header-cell *matHeaderCellDef>Data</th>
            <td mat-cell *matCellDef="let row">{{ row.data }}</td>
          </ng-container>

          <ng-container matColumnDef="situacao">
            <th mat-header-cell *matHeaderCellDef>Situação</th>
            <td mat-cell *matCellDef="let row">
              <span class="mfe-badge mfe-badge--caps" [ngClass]="statusClass(row.situacao)">
                {{ row.situacao }}
              </span>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>
        <mat-paginator [pageSize]="5" [pageSizeOptions]="[5, 10, 20]"></mat-paginator>
      </div>
    </section>
  `,
  styles: [
    `
      .gde-screen {
        display: grid;
        align-content: start;
        grid-auto-rows: max-content;
        gap: var(--mfe-space-4, 16px);
        padding: var(--mfe-space-5, 24px);
        background-color: var(--mfe-surface-muted, #f6f7f9);
        min-height: 100%;
        box-sizing: border-box;
      }

      .screen-header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--mfe-space-4, 16px);
      }

      .screen-header h2 {
        margin: 0 0 var(--mfe-space-1, 4px);
        font-size: var(--font-size-xl, 20px);
        font-weight: var(--font-weight-bold, 700);
        color: var(--mfe-text, #1d2b36);
      }

      .screen-header p {
        margin: 0;
        color: var(--mfe-text-muted, #51606a);
      }

      .eyebrow {
        margin: 0 0 var(--mfe-space-2, 8px);
        font-size: var(--font-size-xs, 12px);
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--mfe-text-muted, #51606a);
        font-weight: var(--font-weight-semi-bold, 600);
      }

      .screen-actions {
        display: flex;
        align-items: center;
        gap: var(--mfe-space-2, 8px);
        flex-wrap: wrap;
      }

      .screen-card {
        display: grid;
        gap: var(--mfe-space-4, 16px);
        padding: var(--mfe-space-4, 16px);
        border-radius: var(--mfe-radius-lg, 16px);
        background: var(--mfe-surface, #ffffff);
        border: 1px solid var(--mfe-border, #e5e9ef);
        box-shadow: var(--mfe-card-shadow, 0px 2px 6px rgba(0, 30, 36, 0.08));
      }

      .filter-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--mfe-space-2, 8px);
        font-size: var(--font-size-sm, 14px);
        padding: var(--mfe-space-3, 12px);
        border-radius: var(--mfe-radius-md, 12px);
        border: 1px dashed var(--mfe-border-strong, #d5dae2);
        background: var(--mfe-surface-muted, #f6f7f9);
      }

      .filter-label {
        font-weight: var(--font-weight-semi-bold, 600);
        color: var(--mfe-text-muted, #51606a);
      }

      .filter-chip {
        padding: 0.3rem 0.75rem;
        border-radius: 999px;
        border: 1px solid var(--mfe-border, #e5e9ef);
        background: var(--mfe-surface, #ffffff);
        color: var(--mfe-text, #1d2b36);
        font-weight: 500;
      }

      .filter-chip.active {
        background: color-mix(in srgb, var(--mfe-primary, #2f6fed) 12%, transparent);
        border-color: color-mix(in srgb, var(--mfe-primary, #2f6fed) 35%, transparent);
        color: var(--mfe-primary, #2f6fed);
        font-weight: var(--font-weight-semi-bold, 600);
      }

      @media (max-width: 960px) {
        .gde-screen {
          padding: var(--mfe-space-4, 16px);
        }
      }
    `
  ]
})
  export class PaymentAdvanceComponent implements AfterViewInit {
  private dialog = inject(MatDialog);

  readonly statusOptions = ['Pago aguardando compensacao', 'Totalmente compensado', 'Cancelado'];

  advances: AdvanceItem[] = [
    {
      id: 276627,
      fornecedor: 'FM Impressos',
      valor: 'R$ 2.220,45',
      data: '08/12/2025',
      situacao: 'Totalmente compensado'
    },
    {
      id: 276624,
      fornecedor: 'FM Impressos',
      valor: 'R$ 2.220,45',
      data: '08/12/2025',
      situacao: 'Pago aguardando compensacao'
    },
    {
      id: 276609,
      fornecedor: 'FM Impressos',
      valor: 'R$ 2.220,45',
      data: '09/12/2025',
      situacao: 'Totalmente compensado'
    },
    {
      id: 276606,
      fornecedor: 'FM Impressos',
      valor: 'R$ 2.220,45',
      data: '09/12/2025',
      situacao: 'Totalmente compensado'
    }
  ];

  readonly displayedColumns = ['id', 'fornecedor', 'valor', 'data', 'situacao'];
  readonly dataSource = new MatTableDataSource<AdvanceItem>(this.advances);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  openAdvanceDialog() {
    const dialogRef = this.dialog.open(PaymentAdvanceDialogComponent, {
      width: '560px',
      data: {
        statusOptions: this.statusOptions
      }
    });

    dialogRef.afterClosed().subscribe((result?: AdvanceForm) => {
      if (!result) {
        return;
      }

      const valor = this.parseNumber(result.valor);
      if (valor === null) {
        return;
      }

      const dataValue = result.data;
      if (!dataValue) {
        return;
      }

      const id = Math.max(...this.advances.map((item) => item.id), 0) + 1;
      const valorFormatado = this.formatCurrency(valor);
      const data = dataValue.toLocaleDateString('pt-BR');

      this.advances = [
        {
          id,
          fornecedor: result.fornecedor.trim(),
          valor: valorFormatado,
          data,
          situacao: result.situacao
        },
        ...this.advances
      ];

      this.dataSource.data = this.advances;
    });
  }

  exportAdvances() {
    const header = ['id', 'fornecedor', 'valor', 'data', 'situacao'];
    const rows = this.advances.map((item) => [
      item.id,
      item.fornecedor,
      item.valor,
      item.data,
      item.situacao
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'adiantamentos.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private parseNumber(value: number | null) {
    if (value === null || value === undefined) {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  statusClass(status: string): string {
    const normalized = status.toLowerCase();
    if (normalized.includes('compensado') || normalized.includes('pago')) {
      return 'mfe-badge--success';
    }
    if (normalized.includes('cancel')) {
      return 'mfe-badge--danger';
    }
    if (normalized.includes('aguard')) {
      return 'mfe-badge--warning';
    }
    return 'mfe-badge--info';
  }
}

@Component({
  selector: 'app-payment-advance-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">Novo adiantamento</h2>
    <mat-dialog-content class="dialog-body">
      <div class="advance-form ds-grid">
        <div class="form-field col-8" [class.field-invalid]="showValidation && validationErrors.fornecedor">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Fornecedor</mat-label>
            <input matInput [(ngModel)]="form.fornecedor" (ngModelChange)="onFormChange()" />
          </mat-form-field>
          @if (showValidation && validationErrors.fornecedor) {
            <span class="field-error">{{ validationErrors.fornecedor }}</span>
          }
        </div>
        <div class="form-field col-4">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Situacao</mat-label>
            <mat-select [(ngModel)]="form.situacao" (ngModelChange)="onFormChange()">
              @for (status of statusOptions; track status) {
                <mat-option [value]="status">{{ status }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
        <div class="form-field col-6" [class.field-invalid]="showValidation && validationErrors.valor">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Valor</mat-label>
            <input matInput type="number" [(ngModel)]="form.valor" (ngModelChange)="onFormChange()" />
          </mat-form-field>
          @if (showValidation && validationErrors.valor) {
            <span class="field-error">{{ validationErrors.valor }}</span>
          }
        </div>
        <div class="form-field col-6" [class.field-invalid]="showValidation && validationErrors.data">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Data prevista</mat-label>
            <input matInput [matDatepicker]="advanceDatePicker" [(ngModel)]="form.data" (ngModelChange)="onFormChange()" />
            <mat-datepicker #advanceDatePicker></mat-datepicker>
          </mat-form-field>
          @if (showValidation && validationErrors.data) {
            <span class="field-error">{{ validationErrors.data }}</span>
          }
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button color="primary" type="button" (click)="resetForm()">Limpar</button>
      <button mat-stroked-button color="primary" type="button" (click)="close()">Cancelar</button>
      <button mat-raised-button color="primary" type="button" (click)="save()">Salvar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .ds-grid {
        display: grid;
        grid-template-columns: repeat(12, minmax(0, 1fr));
        gap: var(--mfe-space-4, 16px);
        align-items: start;
      }

      .col-1 { grid-column: span 1; }
      .col-2 { grid-column: span 2; }
      .col-3 { grid-column: span 3; }
      .col-4 { grid-column: span 4; }
      .col-5 { grid-column: span 5; }
      .col-6 { grid-column: span 6; }
      .col-7 { grid-column: span 7; }
      .col-8 { grid-column: span 8; }
      .col-9 { grid-column: span 9; }
      .col-10 { grid-column: span 10; }
      .col-11 { grid-column: span 11; }
      .col-12 { grid-column: span 12; }

      .form-field {
        display: grid;
        gap: var(--mfe-space-1, 4px);
        min-width: 0;
      }

      .form-field.field-invalid .mat-mdc-text-field-wrapper,
      .form-field.field-invalid .mat-mdc-form-field-flex {
        border-color: var(--color-denotative-danger-default, #d63b3b);
      }

      .field-error {
        color: var(--color-denotative-danger-default, #d63b3b);
        font-size: var(--font-size-xs, 12px);
      }

      .dialog-title {
        margin-bottom: 0;
      }

      .dialog-body {
        padding: var(--mfe-space-4, 16px);
        border-radius: var(--mfe-radius-lg, 16px);
        background: var(--mfe-surface, #ffffff);
        border: 1px solid var(--mfe-border, #e5e9ef);
        box-shadow: var(--mfe-card-shadow, 0px 2px 6px rgba(0, 30, 36, 0.08));
      }

      .advance-form {
        padding: 0;
      }

      .dialog-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: var(--mfe-space-2, 8px);
        width: 100%;
        padding: var(--mfe-space-3, 12px) var(--mfe-space-4, 16px);
      }

      .full-width {
        width: 100%;
      }

      @media (max-width: 900px) {
        .col-4,
        .col-6,
        .col-8 {
          grid-column: span 12;
        }
      }
    `
  ]
})
export class PaymentAdvanceDialogComponent {
  private dialogRef = inject(MatDialogRef<PaymentAdvanceDialogComponent>);
  private data = inject<AdvanceDialogData>(MAT_DIALOG_DATA);

  readonly statusOptions = this.data.statusOptions;

  form: AdvanceForm = this.createDefaultForm();
  showValidation = false;
  validationErrors: AdvanceFormErrors = {};

  close(): void {
    this.dialogRef.close();
  }

  save(): void {
    const errors = this.validateForm();
    this.showValidation = true;
    this.validationErrors = errors;
    if (Object.keys(errors).length > 0) {
      return;
    }

    this.dialogRef.close({ ...this.form });
  }

  resetForm(): void {
    this.form = this.createDefaultForm();
    this.showValidation = false;
    this.validationErrors = {};
  }

  onFormChange(): void {
    if (!this.showValidation) {
      return;
    }
    this.validationErrors = this.validateForm();
  }

  private validateForm(): AdvanceFormErrors {
    const errors: AdvanceFormErrors = {};
    if (!this.form.fornecedor.trim()) {
      errors.fornecedor = 'Informe o fornecedor.';
    }

    const valor = this.parseNumber(this.form.valor);
    if (valor === null || valor <= 0) {
      errors.valor = 'Informe um valor valido.';
    }

    if (!this.form.data) {
      errors.data = 'Informe a data prevista.';
    }

    return errors;
  }

  private parseNumber(value: number | null) {
    if (value === null || value === undefined) {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private createDefaultForm(): AdvanceForm {
    return {
      fornecedor: '',
      valor: null as number | null,
      data: null as Date | null,
      situacao: this.statusOptions[0]
    };
  }
}
