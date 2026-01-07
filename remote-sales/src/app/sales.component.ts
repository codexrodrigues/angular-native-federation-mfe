import { AfterViewInit, Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ReportingService } from 'shared-logic/core';

interface Cooperator {
  id: number;
  nome: string;
  cpf: string;
  categoria: string;
}

type SalesDialogData = {
  cooperator: Cooperator;
  categories: string[];
};

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule
  ],
  template: `
    <section class="sales-page">
      <header class="sales-header">
        <div>
          <h2 style="font-size: var(--font-size-3xl, 28px); font-weight: var(--font-weight-bold, 700);">Gestão de Cooperados</h2>
          <p style="font-size: var(--font-size-md, 16px);">Gerencie os cooperados da unidade.</p>
        </div>
        <button mat-raised-button color="primary" (click)="printReport()">Gerar relatório</button>
      </header>

      <div class="grid-card">
        <table mat-table [dataSource]="dataSource" matSort class="mfe-grid">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th>
            <td mat-cell *matCellDef="let row">{{ row.id }}</td>
          </ng-container>

          <ng-container matColumnDef="nome">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Nome</th>
            <td mat-cell *matCellDef="let row">{{ row.nome }}</td>
          </ng-container>

          <ng-container matColumnDef="cpf">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>CPF</th>
            <td mat-cell *matCellDef="let row">{{ row.cpf }}</td>
          </ng-container>

          <ng-container matColumnDef="categoria">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Categoria</th>
            <td mat-cell *matCellDef="let row">
              <span class="mfe-badge" [ngClass]="categoryClass(row.categoria)">{{ row.categoria }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="acoes">
            <th mat-header-cell *matHeaderCellDef>Ações</th>
            <td mat-cell *matCellDef="let row">
              <button mat-button color="primary" class="action-button" (click)="openEditor(row)">
                <mat-icon aria-hidden="true">edit</mat-icon>
                <span>Editar</span>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>
        <mat-paginator [pageSize]="5" [pageSizeOptions]="[5, 10, 20]"></mat-paginator>
      </div>
    </section>
  `,
  styles: [`
    .sales-page {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xxxs, 16px);
      padding: var(--spacing-xxs, 24px);
    }
    .sales-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--spacing-xxxs, 16px);
    }
    .sales-header h2 {
      margin: 0;
      color: var(--color-surface-text-default-high, #002a33);
    }
    .sales-header p {
      margin: var(--spacing-quarck, 4px) 0 0;
      color: var(--color-surface-text-default-medium, #4a4a4a);
    }
    .grid-card {
      padding: var(--spacing-xxxs, 16px);
      border-radius: var(--border-radius-sm, 8px);
      border: 1px solid var(--color-surface-stroke-low, #e0e0e0);
      background: var(--color-surface-background-low, #ffffff);
      box-shadow: var(--box-shadow-surface, 0px 0px 1px 0 rgba(0, 30, 36, 0.24), 0px 2px 2px 0 rgba(0, 30, 36, 0.24));
      display: grid;
      gap: var(--spacing-nano, 8px);
    }
    .action-button {
      padding: 0 4px;
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-quarck, 4px);
    }
    .action-button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `]
})
export class SalesComponent implements AfterViewInit {
  private reporting = inject(ReportingService);
  private dialog = inject(MatDialog);

  readonly categories = ['Individual', 'Rural', 'Empresarial'];

  cooperatorList: Cooperator[] = [
    { id: 1, nome: 'Pessoa Exemplo 01', cpf: '000.000.000-00', categoria: 'Individual' },
    { id: 2, nome: 'Pessoa Exemplo 02', cpf: '111.111.111-11', categoria: 'Rural' },
    { id: 3, nome: 'Empresa Exemplo Ltda', cpf: '00.000.000/0000-00', categoria: 'Empresarial' },
    { id: 4, nome: 'Pessoa Exemplo 03', cpf: '222.222.222-22', categoria: 'Individual' }
  ];

  readonly displayedColumns = ['id', 'nome', 'cpf', 'categoria', 'acoes'];
  readonly dataSource = new MatTableDataSource<Cooperator>(this.cooperatorList);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  categoryClass(category: string): string {
    const normalized = category.toLowerCase();
    if (normalized.includes('rural')) {
      return 'mfe-badge--success';
    }
    if (normalized.includes('empresarial')) {
      return 'mfe-badge--warning';
    }
    if (normalized.includes('individual')) {
      return 'mfe-badge--primary';
    }
    return 'mfe-badge--neutral';
  }

  openEditor(cooperator: Cooperator) {
    const dialogRef = this.dialog.open(SalesEditorDialogComponent, {
      width: '440px',
      data: {
        cooperator,
        categories: this.categories
      }
    });

    dialogRef.afterClosed().subscribe((result?: Cooperator) => {
      if (!result) {
        return;
      }

      this.cooperatorList = this.cooperatorList.map((item) =>
        item.id === result.id ? result : item
      );
      this.dataSource.data = this.cooperatorList;
    });
  }

  printReport() {
    this.reporting.print({
      title: 'Relatório de Cooperados',
      items: this.cooperatorList,
      date: new Date().toISOString()
    });
  }
}

@Component({
  selector: 'app-sales-editor-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>Editar cooperado</h2>
    <mat-dialog-content class="dialog-form">
      <mat-form-field appearance="outline" class="form-field">
        <mat-label>Nome</mat-label>
        <input matInput [(ngModel)]="model.nome" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="form-field">
        <mat-label>CPF</mat-label>
        <input matInput [(ngModel)]="model.cpf" readonly />
      </mat-form-field>

      <mat-form-field appearance="outline" class="form-field">
        <mat-label>Categoria</mat-label>
        <mat-select [(ngModel)]="model.categoria">
          @for (category of categories; track category) {
            <mat-option [value]="category">{{ category }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button color="primary" type="button" (click)="close()">Cancelar</button>
      <button mat-raised-button color="primary" type="button" (click)="save()">Salvar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-form {
        display: grid;
        gap: var(--spacing-nano, 12px);
        padding: var(--spacing-quarck, 4px) 0;
      }

      .form-field {
        width: 100%;
      }
    `
  ]
})
export class SalesEditorDialogComponent {
  private dialogRef = inject(MatDialogRef<SalesEditorDialogComponent>);
  private data = inject<SalesDialogData>(MAT_DIALOG_DATA);

  readonly categories = this.data.categories;
  readonly model: Cooperator = { ...this.data.cooperator };

  close(): void {
    this.dialogRef.close();
  }

  save(): void {
    this.dialogRef.close(this.model);
  }
}
