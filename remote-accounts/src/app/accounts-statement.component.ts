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

interface StatementItem {
  data: string;
  descricao: string;
  tipo: string;
  valor: string;
  saldo: string;
}

type AnalysisForm = {
  period: string;
  type: string;
  keyword: string;
  minValue: number | null;
  maxValue: number | null;
  startDate: Date | null;
  endDate: Date | null;
};

type AnalysisDialogData = {
  periods: string[];
  types: string[];
  form: AnalysisForm;
};

@Component({
  selector: 'app-accounts-statement',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatPaginatorModule, MatTableModule, MatDialogModule],
  template: `
    <section class="accounts-statement">
      <header class="statement-header">
        <div>
          <p class="eyebrow">Movimentacoes</p>
          <h2>Extratos da conta corrente</h2>
          <p>Analise entradas e saidas com base em periodos e filtros.</p>
        </div>
        <div class="statement-actions">
          <button mat-stroked-button color="primary">Exportar</button>
          <button mat-raised-button color="primary" (click)="openAnalysis()">Nova analise</button>
        </div>
      </header>

      <div class="statement-card">
        <div class="filter-row">
          <span class="filter-label">Periodo</span>
          <span class="filter-chip active">Ultimos 30 dias</span>
          <span class="filter-chip">Ultimos 90 dias</span>
          <span class="filter-chip">Personalizado</span>
        </div>

        <table mat-table [dataSource]="dataSource" class="mfe-grid">
          <ng-container matColumnDef="data">
            <th mat-header-cell *matHeaderCellDef>Data</th>
            <td mat-cell *matCellDef="let row">{{ row.data }}</td>
          </ng-container>

          <ng-container matColumnDef="descricao">
            <th mat-header-cell *matHeaderCellDef>Descricao</th>
            <td mat-cell *matCellDef="let row">{{ row.descricao }}</td>
          </ng-container>

          <ng-container matColumnDef="tipo">
            <th mat-header-cell *matHeaderCellDef>Tipo</th>
            <td mat-cell *matCellDef="let row">
              <span class="mfe-badge mfe-badge--caps" [ngClass]="typeClass(row.tipo)">
                {{ row.tipo }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="valor">
            <th mat-header-cell *matHeaderCellDef>Valor</th>
            <td mat-cell *matCellDef="let row">
              <span class="mfe-badge" [ngClass]="amountClass(row.tipo)">{{ row.valor }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="saldo">
            <th mat-header-cell *matHeaderCellDef>Saldo</th>
            <td mat-cell *matCellDef="let row">
              <span class="mfe-badge mfe-badge--neutral">{{ row.saldo }}</span>
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
      .accounts-statement {
        display: grid;
        gap: var(--spacing-xxs, 24px);
        padding: var(--spacing-xxs, 24px);
      }

      .statement-header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--spacing-xxxs, 16px);
      }

      .statement-header h2 {
        margin: 0 0 var(--spacing-quarck, 4px);
        font-size: var(--font-size-xl, 20px);
        font-weight: var(--font-weight-bold, 700);
        color: var(--color-surface-text-default-high, #002a33);
      }

      .statement-header p {
        margin: 0;
        color: var(--color-surface-text-default-medium, #515151);
        font-size: var(--font-size-md, 16px);
      }

      .eyebrow {
        margin: 0 0 var(--spacing-nano, 8px);
        font-size: var(--font-size-xs, 12px);
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--color-surface-text-default-medium, #515151);
        font-weight: var(--font-weight-semi-bold, 600);
      }

      .statement-actions {
        display: flex;
        align-items: center;
        gap: var(--spacing-nano, 8px);
        flex-wrap: wrap;
      }

      .statement-card {
        display: grid;
        gap: var(--spacing-xxxs, 16px);
        padding: var(--spacing-xxs, 24px);
        border-radius: var(--border-radius-lg, 24px);
        background: var(--color-surface-background-low, #ffffff);
        border: 1px solid var(--color-surface-stroke-low, #f0f0f0);
        box-shadow: var(--box-shadow-surface, 0px 0px 1px 0 rgba(0, 30, 36, 0.24), 0px 2px 2px 0 rgba(0, 30, 36, 0.24));
      }

      .filter-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--spacing-nano, 8px);
        font-size: var(--font-size-sm, 14px);
      }

      .filter-label {
        font-weight: var(--font-weight-semi-bold, 600);
        color: var(--color-surface-text-default-medium, #515151);
      }

      .filter-chip {
        padding: var(--spacing-quarck, 4px) var(--spacing-xxxs, 16px);
        border-radius: var(--border-radius-pill, 1000px);
        border: 1px solid var(--color-surface-stroke-medium, #d5dae2);
        background: var(--color-surface-background-low, #ffffff);
        color: var(--color-surface-text-default-high, #002a33);
        cursor: pointer;
        transition: all 0.2s ease-in-out;
      }

      .filter-chip.active {
        background: var(--color-function-primary-lightest, #effefb);
        border-color: var(--color-brand-main, #2f6fed);
        color: var(--color-brand-main, #2f6fed);
        font-weight: var(--font-weight-semi-bold, 600);
      }

    `
  ]
})
export class AccountsStatementComponent implements AfterViewInit {
  private dialog = inject(MatDialog);

  readonly analysisPeriods = ['Ultimos 30 dias', 'Ultimos 90 dias', 'Personalizado'];
  readonly analysisTypes = ['Todos', 'Credito', 'Debito'];

  analysisForm = this.createDefaultAnalysisForm();

  readonly transactions: StatementItem[] = [
    {
      data: '18/12/2025',
      descricao: 'Credito cooperado - aporte',
      tipo: 'Credito',
      valor: 'R$ 4.850,00',
      saldo: 'R$ 18.450,23'
    },
    {
      data: '17/12/2025',
      descricao: 'Pagamento fornecedor',
      tipo: 'Debito',
      valor: 'R$ 1.250,40',
      saldo: 'R$ 13.600,23'
    },
    {
      data: '16/12/2025',
      descricao: 'Tarifa pacote mensal',
      tipo: 'Debito',
      valor: 'R$ 48,00',
      saldo: 'R$ 14.850,63'
    },
    {
      data: '15/12/2025',
      descricao: 'Transferencia entre cooperativas',
      tipo: 'Credito',
      valor: 'R$ 2.300,00',
      saldo: 'R$ 14.898,63'
    },
    {
      data: '14/12/2025',
      descricao: 'Pagamento boleto',
      tipo: 'Debito',
      valor: 'R$ 340,00',
      saldo: 'R$ 12.598,63'
    },
    {
      data: '12/12/2025',
      descricao: 'Pix recebido',
      tipo: 'Credito',
      valor: 'R$ 150,00',
      saldo: 'R$ 12.938,63'
    },
    {
      data: '10/12/2025',
      descricao: 'Compra cartao debito',
      tipo: 'Debito',
      valor: 'R$ 89,90',
      saldo: 'R$ 12.788,63'
    }
  ];

  readonly displayedColumns = ['data', 'descricao', 'tipo', 'valor', 'saldo'];
  readonly dataSource = new MatTableDataSource<StatementItem>(this.transactions);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  openAnalysis() {
    const dialogRef = this.dialog.open(AccountsAnalysisDialogComponent, {
      width: '560px',
      data: {
        periods: this.analysisPeriods,
        types: this.analysisTypes,
        form: this.analysisForm
      }
    });

    dialogRef.afterClosed().subscribe((result?: AnalysisForm) => {
      if (result) {
        this.analysisForm = result;
      }
    });
  }

  typeClass(type: string): string {
    const normalized = type.toLowerCase();
    if (normalized.includes('credito')) {
      return 'mfe-badge--success';
    }
    if (normalized.includes('debito')) {
      return 'mfe-badge--danger';
    }
    return 'mfe-badge--neutral';
  }

  amountClass(type: string): string {
    return this.typeClass(type);
  }

  private createDefaultAnalysisForm(): AnalysisForm {
    return {
      period: 'Ultimos 30 dias',
      type: 'Todos',
      keyword: '',
      minValue: null,
      maxValue: null,
      startDate: null,
      endDate: null
    };
  }
}

@Component({
  selector: 'app-accounts-analysis-dialog',
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
    <h2 mat-dialog-title>Nova analise de extratos</h2>
    <mat-dialog-content class="analysis-form">
      <mat-form-field appearance="outline" class="form-field">
        <mat-label>Periodo</mat-label>
        <mat-select [(ngModel)]="form.period">
          @for (period of periods; track period) {
            <mat-option [value]="period">{{ period }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      @if (form.period === 'Personalizado') {
        <div class="form-row">
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Inicio</mat-label>
            <input matInput [matDatepicker]="startPicker" [(ngModel)]="form.startDate" />
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Fim</mat-label>
            <input matInput [matDatepicker]="endPicker" [(ngModel)]="form.endDate" />
            <mat-datepicker #endPicker></mat-datepicker>
          </mat-form-field>
        </div>
      }

      <mat-form-field appearance="outline" class="form-field">
        <mat-label>Tipo de movimento</mat-label>
        <mat-select [(ngModel)]="form.type">
          @for (type of types; track type) {
            <mat-option [value]="type">{{ type }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="form-field">
        <mat-label>Palavra-chave</mat-label>
        <input matInput [(ngModel)]="form.keyword" placeholder="Fornecedor, agencia, documento" />
      </mat-form-field>

      <div class="form-row">
        <mat-form-field appearance="outline" class="form-field">
          <mat-label>Valor minimo</mat-label>
          <input matInput type="number" [(ngModel)]="form.minValue" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="form-field">
          <mat-label>Valor maximo</mat-label>
          <input matInput type="number" [(ngModel)]="form.maxValue" />
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button color="primary" type="button" (click)="reset()">Limpar</button>
      <button mat-stroked-button color="primary" type="button" (click)="close()">Cancelar</button>
      <button mat-raised-button color="primary" type="button" (click)="apply()">Aplicar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .analysis-form {
        display: grid;
        gap: var(--spacing-xxs, 20px);
        padding: var(--spacing-nano, 8px) 0;
      }

      .form-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spacing-xxxs, 16px);
      }

      .form-field {
        width: 100%;
      }
    `
  ]
})
export class AccountsAnalysisDialogComponent {
  private dialogRef = inject(MatDialogRef<AccountsAnalysisDialogComponent>);
  private data = inject<AnalysisDialogData>(MAT_DIALOG_DATA);

  readonly periods = this.data.periods;
  readonly types = this.data.types;

  form: AnalysisForm = { ...this.data.form };

  close(): void {
    this.dialogRef.close();
  }

  apply(): void {
    this.dialogRef.close(this.form);
  }

  reset(): void {
    this.form = {
      period: 'Ultimos 30 dias',
      type: 'Todos',
      keyword: '',
      minValue: null,
      maxValue: null,
      startDate: null,
      endDate: null
    };
  }
}
