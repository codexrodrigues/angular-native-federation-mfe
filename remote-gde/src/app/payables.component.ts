import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import {
  ActionBarComponent,
  ContentCardComponent,
  DetailsDrawerComponent,
  DrawerCallout,
  DrawerMetaItem,
  PageBreadcrumb,
  PageHeaderAction,
  PageHeaderComponent
} from 'shared-ui-lib';
import { PayablesService, PayableItem } from './services/payables.service';

type DrawerEvent = {
  etapa: string;
  data: string;
  detalhe: string;
  status: string;
};

@Component({
  selector: 'app-payables',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatSelectModule,
    MatTableModule,
    PageHeaderComponent,
    ContentCardComponent,
    ActionBarComponent,
    DetailsDrawerComponent
  ],
  template: `
    <lib-details-drawer
      [open]="drawerOpen()"
      [title]="drawerTitle()"
      [subtitle]="drawerSubtitle()"
      size="lg"
      [meta]="drawerMeta()"
      [callout]="drawerCallout()"
      sectionTitle="Parcelas e eventos"
      (close)="closeDrawer()"
      (calloutAction)="downloadReceipt()"
    >
      <section class="payables-page">
        <lib-page-header
          [title]="'Contas a pagar'"
          [subtitle]="'Acompanhe registros, fornecedores e vencimentos com governança.'"
          [breadcrumbs]="breadcrumbs"
          [actions]="pageActions"
          (actionClick)="handlePageAction($event)"
        ></lib-page-header>

        <lib-content-card
          title="Pesquisar"
          subtitle="Refine por instituicao, periodo, valor e status."
        >
          <div card-actions class="card-actions card-actions--filters">
            <div class="card-actions__group">
              <button mat-stroked-button color="primary" (click)="clearFilters()">Limpar</button>
              <button mat-raised-button color="primary">Pesquisar</button>
            </div>
            <button
              mat-button
              class="toggle-button"
              (click)="toggleFilters()"
              [attr.aria-expanded]="filtersExpanded()"
            >
              {{ filtersExpanded() ? 'Ocultar filtros' : 'Exibir filtros' }}
            </button>
          </div>

          @if (filtersExpanded()) {
            <div class="filters-panel">
              <div class="filters-grid" aria-label="Filtros de pesquisa">
                <div class="filter-field filter-field--wide">
                  <span class="field-label">Instituição responsável</span>
                  <div class="input-group">
                    <mat-checkbox disabled></mat-checkbox>
                    <mat-form-field appearance="outline" class="field-control flex-1">
                      <input matInput [value]="'2009 - COOPERATIVA ALFA'" disabled />
                    </mat-form-field>
                  </div>
                </div>

                <div class="filter-field">
                  <mat-form-field appearance="outline" class="field-control">
                    <mat-label>Origem</mat-label>
                    <mat-select [value]="'TODOS'">
                      @for (option of ['TODOS', 'MANUAL', 'IMPORTADO']; track option) {
                        <mat-option [value]="option">{{ option }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="filter-field">
                  <span class="field-label">ID conta a pagar</span>
                  <div class="range-inputs">
                    <mat-form-field appearance="outline" class="field-control flex-1">
                      <input matInput placeholder="Inicio" />
                    </mat-form-field>
                    <span class="range-separator">a</span>
                    <mat-form-field appearance="outline" class="field-control flex-1">
                      <input matInput placeholder="Fim" />
                    </mat-form-field>
                  </div>
                </div>

                <div class="filter-field filter-field--wide">
                  <mat-form-field appearance="outline" class="field-control">
                    <mat-label>Instituição</mat-label>
                    <input matInput [value]="'4340 - COOPERATIVA BETA'" disabled />
                  </mat-form-field>
                </div>

                <div class="filter-field">
                  <span class="field-label">Valor do documento</span>
                  <div class="range-inputs">
                    <mat-form-field appearance="outline" class="field-control flex-1">
                      <input matInput type="number" />
                    </mat-form-field>
                    <span class="range-separator">a</span>
                    <mat-form-field appearance="outline" class="field-control flex-1">
                      <input matInput type="number" />
                    </mat-form-field>
                  </div>
                </div>

                <div class="filter-field">
                  <span class="field-label">PA</span>
                  <div class="input-group">
                    <mat-form-field appearance="outline" class="field-control flex-1">
                      <input matInput [value]="'TODOS'" />
                    </mat-form-field>
                    <mat-checkbox class="checkbox-label">Matriz/UAD</mat-checkbox>
                  </div>
                </div>

                <div class="filter-field">
                  <mat-form-field appearance="outline" class="field-control">
                    <mat-label>Situação</mat-label>
                    <mat-select [value]="'EM ELABORAÇÃO'">
                      @for (option of ['EM ELABORAÇÃO', 'ABERTO', 'PAGO', 'CANCELADO']; track option) {
                        <mat-option [value]="option">{{ option }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="filter-field filter-field--wide">
                  <span class="field-label">Fornecedor</span>
                  <div class="input-group">
                    <mat-form-field appearance="outline" class="field-control w-140">
                      <input matInput [value]="'11111111111111'" />
                    </mat-form-field>
                    <button mat-icon-button color="primary" type="button" aria-label="Buscar fornecedor">
                      <mat-icon>search</mat-icon>
                    </button>
                    <mat-form-field appearance="outline" class="field-control flex-1">
                      <input matInput [value]="'FORNECEDOR BETA S.A.'" />
                    </mat-form-field>
                  </div>
                </div>

                <div class="filter-field">
                  <span class="field-label">Data de entrada</span>
                  <div class="range-inputs">
                    <mat-form-field appearance="outline" class="field-control flex-1">
                      <input matInput [matDatepicker]="entryStart" />
                      <mat-datepicker #entryStart></mat-datepicker>
                    </mat-form-field>
                    <span class="range-separator">a</span>
                    <mat-form-field appearance="outline" class="field-control flex-1">
                      <input matInput [matDatepicker]="entryEnd" />
                      <mat-datepicker #entryEnd></mat-datepicker>
                    </mat-form-field>
                  </div>
                </div>

                <div class="filter-field">
                  <mat-form-field appearance="outline" class="field-control">
                    <mat-label>Forma de pagamento</mat-label>
                    <mat-select [value]="'SELECIONE'">
                      @for (option of ['SELECIONE', 'BOLETO', 'TED', 'PIX']; track option) {
                        <mat-option [value]="option">{{ option }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="filter-field">
                  <span class="field-label">Data prevista de pagamento</span>
                  <div class="range-inputs">
                    <mat-form-field appearance="outline" class="field-control flex-1">
                      <input matInput [matDatepicker]="paymentStart" [value]="today" />
                      <mat-datepicker #paymentStart></mat-datepicker>
                    </mat-form-field>
                    <span class="range-separator">a</span>
                    <mat-form-field appearance="outline" class="field-control flex-1">
                      <input matInput [matDatepicker]="paymentEnd" [value]="today" />
                      <mat-datepicker #paymentEnd></mat-datepicker>
                    </mat-form-field>
                  </div>
                </div>
              </div>
            </div>
          }
        </lib-content-card>

        <lib-content-card
          title="Lista de dados"
          [subtitle]="resultCount() + ' resultados'"
          variant="table"
        >
          <div card-actions class="card-actions">
            <button mat-button>Exportar</button>
            <button mat-button>Colunas</button>
            <button mat-button>Filtros</button>
          </div>

          <table mat-table [dataSource]="pagedPayables()" class="mfe-grid">
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef>ID</th>
              <td mat-cell *matCellDef="let row">{{ row.id }}</td>
            </ng-container>

            <ng-container matColumnDef="instituicao">
              <th mat-header-cell *matHeaderCellDef>Instituição</th>
              <td mat-cell *matCellDef="let row">{{ row.instituicao }}</td>
            </ng-container>

            <ng-container matColumnDef="pa">
              <th mat-header-cell *matHeaderCellDef>PA</th>
              <td mat-cell *matCellDef="let row">{{ row.pa }}</td>
            </ng-container>

            <ng-container matColumnDef="fornecedor">
              <th mat-header-cell *matHeaderCellDef>Fornecedor</th>
              <td mat-cell *matCellDef="let row">{{ row.fornecedor }}</td>
            </ng-container>

            <ng-container matColumnDef="documento">
              <th mat-header-cell *matHeaderCellDef>Documento</th>
              <td mat-cell *matCellDef="let row">{{ row.documento }}</td>
            </ng-container>

            <ng-container matColumnDef="vencimento">
              <th mat-header-cell *matHeaderCellDef>Vencimento</th>
              <td mat-cell *matCellDef="let row">{{ row.vencimento }}</td>
            </ng-container>

            <ng-container matColumnDef="valor">
              <th mat-header-cell *matHeaderCellDef>Valor</th>
              <td mat-cell *matCellDef="let row">
                <span class="mfe-badge mfe-badge--primary">R$ {{ row.valor }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="situacao">
              <th mat-header-cell *matHeaderCellDef>Situação</th>
              <td mat-cell *matCellDef="let row">
                <span class="mfe-badge mfe-badge--caps" [ngClass]="statusClass(row.situacao)">
                  {{ row.situacao }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="origem">
              <th mat-header-cell *matHeaderCellDef>Origem</th>
              <td mat-cell *matCellDef="let row">
                <span class="mfe-badge mfe-badge--caps" [ngClass]="originClass(row.origem)">
                  {{ row.origem }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="acoes">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <button
                  mat-button
                  color="primary"
                  class="row-action"
                  (click)="openDrawerFromRow(row)"
                  aria-label="Detalhar"
                >
                  <mat-icon aria-hidden="true">visibility</mat-icon>
                  <span>Ver</span>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr
              mat-row
              *matRowDef="let row; columns: displayedColumns"
              (click)="selectPayable(row)"
              [class.is-selected]="selectedPayable()?.id === row.id"
            ></tr>
          </table>

          <mat-paginator
            [length]="payables().length"
            [pageSize]="pageSize()"
            [pageIndex]="pageIndex()"
            [pageSizeOptions]="[5, 10, 20]"
            (page)="onPage($event)"
          ></mat-paginator>
        </lib-content-card>

        <lib-action-bar>
          <div action-bar-summary>
            <span>Selecionados: {{ selectedCount() }}</span>
            <span class="summary-separator">|</span>
            <span>Valor total: {{ selectedTotal() }}</span>
          </div>
          <div action-bar-actions>
            <button
              mat-stroked-button
              color="primary"
              [disabled]="!selectedPayable()"
              (click)="openDrawer()"
            >
              Visualizar
            </button>
            <button mat-raised-button color="primary" (click)="newPayable()">Incluir</button>
            <button
              mat-stroked-button
              color="primary"
              [disabled]="!selectedPayable()"
              (click)="editSelected()"
            >
              Alterar
            </button>
            <button mat-stroked-button color="primary" [disabled]="!selectedPayable()">Excluir</button>
            <button mat-button color="primary">Fechar</button>
            <button mat-button color="primary">Ajuda</button>
          </div>
        </lib-action-bar>
      </section>

      <div drawer-body>
        <div class="drawer-status">
          <span class="mfe-badge mfe-badge--caps" [ngClass]="statusClass(selectedPayable()?.situacao)">
            {{ selectedPayable()?.situacao || 'Sem selecao' }}
          </span>
          <span class="mfe-badge mfe-badge--caps" [ngClass]="originClass(selectedPayable()?.origem)">
            Origem: {{ selectedPayable()?.origem || '-' }}
          </span>
        </div>

        <table mat-table [dataSource]="drawerEvents" class="mfe-grid drawer-grid">
          <ng-container matColumnDef="etapa">
            <th mat-header-cell *matHeaderCellDef>Etapa</th>
            <td mat-cell *matCellDef="let row">{{ row.etapa }}</td>
          </ng-container>

          <ng-container matColumnDef="data">
            <th mat-header-cell *matHeaderCellDef>Data</th>
            <td mat-cell *matCellDef="let row">{{ row.data }}</td>
          </ng-container>

          <ng-container matColumnDef="detalhe">
            <th mat-header-cell *matHeaderCellDef>Detalhe</th>
            <td mat-cell *matCellDef="let row">{{ row.detalhe }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let row">
              <span class="mfe-badge mfe-badge--caps" [ngClass]="statusClass(row.status)">
                {{ row.status }}
              </span>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="drawerDisplayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: drawerDisplayedColumns"></tr>
        </table>
      </div>
    </lib-details-drawer>
  `,
  styles: [
    `
      .payables-page {
        display: grid;
        align-content: start;
        grid-auto-rows: max-content;
        gap: var(--mfe-space-4, 16px);
      }

      .card-actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mfe-space-2, 8px);
      }

      .card-actions--filters {
        width: 100%;
        justify-content: space-between;
        align-items: center;
      }

      .card-actions__group {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mfe-space-2, 8px);
        align-items: center;
      }

      .toggle-button {
        margin-left: auto;
      }

      .filters-panel {
        padding: var(--mfe-space-4, 16px);
        border-radius: var(--mfe-radius-lg, 16px);
        border: 1px solid var(--mfe-border, #e5e9ef);
        background: var(--mfe-surface-muted, #f6f7f9);
      }

      .filters-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: var(--mfe-space-3, 12px) var(--mfe-space-4, 16px);
      }

      .filter-field {
        display: grid;
        gap: var(--mfe-space-2, 8px);
        padding: var(--mfe-space-3, 12px);
        border-radius: var(--mfe-radius-md, 12px);
        border: 1px solid color-mix(in srgb, var(--mfe-border, #e5e9ef) 70%, transparent);
        background: var(--mfe-surface, #ffffff);
      }

      .filter-field--wide {
        grid-column: span 2;
      }

      .field-label {
        font-size: var(--font-size-sm, 14px);
        font-weight: var(--font-weight-semi-bold, 600);
        color: var(--mfe-text, #1d2b36);
      }

      .input-group {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--mfe-space-2, 8px);
      }

      .range-inputs {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: var(--mfe-space-2, 8px);
      }

      .range-separator {
        font-size: var(--font-size-xs, 12px);
        color: var(--mfe-text-muted, #51606a);
      }

      .checkbox-label {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: var(--font-size-sm, 14px);
        color: var(--mfe-text, #1d2b36);
        white-space: nowrap;
      }

      .field-control {
        width: 100%;
      }

      .flex-1 {
        flex: 1;
      }

      .w-140 {
        width: 140px;
        flex: none;
      }

      .row-action {
        color: var(--mfe-primary, #2f6fed);
        display: inline-flex;
        align-items: center;
        gap: var(--mfe-space-1, 4px);
      }

      .row-action mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .summary-separator {
        color: var(--mfe-border-strong, #d5dae2);
      }

      .drawer-status {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mfe-space-2, 8px);
        margin-bottom: var(--mfe-space-2, 8px);
      }

      .drawer-grid {
        min-height: 220px;
      }

      @media (max-width: 1024px) {
        .filter-field--wide {
          grid-column: auto;
        }
      }

      @media (max-width: 720px) {
        .card-actions--filters {
          align-items: flex-start;
          flex-direction: column;
        }

        .toggle-button {
          margin-left: 0;
        }

        .range-inputs {
          grid-template-columns: 1fr;
        }

        .range-separator {
          display: none;
        }
      }
    `
  ]
})
export class PayablesComponent {
  private router = inject(Router);
  private payablesService = inject(PayablesService);

  today = new Date(2025, 11, 23);

  readonly breadcrumbs: PageBreadcrumb[] = [
    { label: 'Início' },
    { label: 'GDE' },
    { label: 'Contas a pagar' }
  ];

  readonly pageActions: PageHeaderAction[] = [
    { id: 'new', label: 'Nova conta', tone: 'primary', fillMode: 'solid' },
    { id: 'export', label: 'Exportar', tone: 'neutral', fillMode: 'outline' }
  ];

  payables = computed(() => this.payablesService.getAll());
  resultCount = computed(() => this.payables().length);

  selectedPayable = signal<PayableItem | null>(null);

  readonly selectedCount = computed(() => (this.selectedPayable() ? 1 : 0));
  readonly selectedTotal = computed(() => {
    const selected = this.selectedPayable();
    return selected ? `R$ ${selected.valor}` : 'R$ 0,00';
  });

  readonly filtersExpanded = signal(true);
  readonly drawerOpen = signal(false);

  readonly pageSize = signal(5);
  readonly pageIndex = signal(0);

  readonly pagedPayables = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.payables().slice(start, start + this.pageSize());
  });

  readonly displayedColumns = [
    'id',
    'instituicao',
    'pa',
    'fornecedor',
    'documento',
    'vencimento',
    'valor',
    'situacao',
    'origem',
    'acoes'
  ];

  readonly drawerDisplayedColumns = ['etapa', 'data', 'detalhe', 'status'];

  readonly drawerEvents: DrawerEvent[] = [
    {
      etapa: 'Registro',
      data: '22/12/2025',
      detalhe: 'Conta importada e registrada.',
      status: 'Sucesso'
    },
    {
      etapa: 'Validacao',
      data: '22/12/2025',
      detalhe: 'Documento validado pela cooperativa.',
      status: 'Alerta'
    },
    {
      etapa: 'Pagamento',
      data: '23/12/2025',
      detalhe: 'Programado para liquidacao.',
      status: 'Agendado'
    }
  ];

  drawerTitle = computed(() => {
    const item = this.selectedPayable();
    return item ? `Conta ${item.id}` : 'Conta selecionada';
  });

  drawerSubtitle = computed(() => this.selectedPayable()?.fornecedor ?? '');

  drawerMeta = computed<DrawerMetaItem[]>(() => {
    const item = this.selectedPayable();
    if (!item) {
      return [];
    }

    return [
      { label: 'Instituição', value: item.instituicao },
      { label: 'PA', value: String(item.pa) },
      { label: 'Documento', value: item.documento },
      { label: 'Vencimento', value: item.vencimento },
      { label: 'Valor', value: `R$ ${item.valor}` },
      { label: 'Origem', value: item.origem }
    ];
  });

  drawerCallout = computed<DrawerCallout | undefined>(() => {
    const item = this.selectedPayable();
    if (!item) {
      return undefined;
    }

    return {
      title: 'Pagamento previsto',
      message: `Programado para ${item.vencimento}.`,
      actionLabel: 'Baixar comprovante'
    };
  });

  onPage(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  selectPayable(item: PayableItem) {
    this.selectedPayable.set(item);
  }

  openDrawer() {
    if (this.selectedPayable()) {
      this.drawerOpen.set(true);
    }
  }

  openDrawerFromRow(item: PayableItem) {
    this.selectPayable(item);
    this.drawerOpen.set(true);
  }

  closeDrawer() {
    this.drawerOpen.set(false);
  }

  toggleFilters() {
    this.filtersExpanded.update((expanded) => !expanded);
  }

  clearFilters() {
    // Placeholder for clear logic.
  }

  handlePageAction(actionId: string) {
    if (actionId === 'new') {
      this.newPayable();
    }
  }

  downloadReceipt() {
    // Placeholder for download action.
  }

  editSelected() {
    const item = this.selectedPayable();
    if (item) {
      this.router.navigate(['/gde/legacy-form', item.id]);
    }
  }

  newPayable() {
    this.router.navigate(['/gde/legacy-form', 'new']);
  }

  statusClass(status?: string | null): string {
    if (!status) {
      return 'mfe-badge--neutral';
    }

    const normalized = status.toLowerCase();
    if (normalized.includes('pago') || normalized.includes('sucesso')) {
      return 'mfe-badge--success';
    }
    if (normalized.includes('cancel') || normalized.includes('erro')) {
      return 'mfe-badge--danger';
    }
    if (normalized.includes('aberto') || normalized.includes('agendado')) {
      return 'mfe-badge--info';
    }
    return 'mfe-badge--warning';
  }

  originClass(origin?: string | null): string {
    if (!origin) {
      return 'mfe-badge--neutral';
    }

    const normalized = origin.toLowerCase();
    if (normalized.includes('manual')) {
      return 'mfe-badge--neutral';
    }
    if (normalized.includes('pre') || normalized.includes('pré')) {
      return 'mfe-badge--info';
    }
    return 'mfe-badge--primary';
  }
}
