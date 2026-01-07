import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { ActionBarComponent } from 'shared-ui-lib';
import { DRAWER_DATA, DrawerRef, DrawerService } from 'shared-logic/angular';

@Component({
  selector: 'app-installment-create',
  standalone: true,
  imports: [MatButtonModule, MatTabsModule],
  template: `
    <section class="gde-screen">
      <header class="screen-header">
        <div>
          <p class="eyebrow">Contas a pagar</p>
          <h2>Inclusao parcela a pagar</h2>
          <p>Registre dados da parcela e consulte o convenio.</p>
        </div>
        <div class="screen-actions">
          <button
            mat-button
            color="primary"
            type="button"
            (click)="openDrawer()"
            [disabled]="!drawerAvailable"
          >
            Ver detalhes
          </button>
          <button mat-stroked-button color="primary" type="button">Cancelar</button>
          <button mat-raised-button color="primary" type="button">Salvar</button>
        </div>
      </header>

      <mat-tab-group class="screen-tabs">
        <mat-tab label="Parcela">
          <div class="screen-card ds-grid">
            <div class="col-3 summary-tile">
              <span class="field-label">Data vencimento</span>
              <span class="field-value">19/12/2025</span>
            </div>
            <div class="col-3 summary-tile">
              <span class="field-label">Forma de pagamento</span>
              <span class="field-value">Convenios e tributos</span>
            </div>
            <div class="col-3 summary-tile">
              <span class="field-label">Valor pagamento</span>
              <span class="field-value">R$ 37,02</span>
            </div>
            <div class="col-3 summary-tile">
              <span class="field-label">Dias atraso</span>
              <span class="field-value">0</span>
            </div>
            <div class="col-12 section-note">
              <p class="section-title">Retorno da consulta</p>
              <p class="section-subtitle">Nenhuma consulta realizada ainda.</p>
            </div>
          </div>
        </mat-tab>
        <mat-tab label="Abatimento e Desconto">
          <div class="placeholder-tab">Conteudo da aba Abatimento e Desconto.</div>
        </mat-tab>
        <mat-tab label="Juros e Multa">
          <div class="placeholder-tab">Conteudo da aba Juros e Multa.</div>
        </mat-tab>
        <mat-tab label="Consolidacao">
          <div class="placeholder-tab">Conteudo da aba Consolidacao.</div>
        </mat-tab>
      </mat-tab-group>
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

      .screen-tabs {
        background: var(--mfe-surface, #ffffff);
        border-radius: var(--mfe-radius-lg, 16px);
        border: 1px solid var(--mfe-border, #e5e9ef);
        overflow: hidden;
      }

      .screen-card {
        padding: var(--mfe-space-4, 16px);
        border-radius: var(--mfe-radius-lg, 16px);
        background: var(--mfe-surface, #ffffff);
        border: 1px solid var(--mfe-border, #e5e9ef);
        box-shadow: var(--mfe-card-shadow, 0px 2px 6px rgba(0, 30, 36, 0.08));
      }

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

      .summary-tile {
        display: grid;
        gap: var(--mfe-space-1, 4px);
        padding: var(--mfe-space-3, 12px);
        border-radius: var(--mfe-radius-md, 12px);
        background: var(--mfe-surface-muted, #f6f7f9);
        border: 1px solid var(--mfe-border, #e5e9ef);
      }

      .field-label {
        font-size: var(--font-size-xs, 12px);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--mfe-text-muted, #51606a);
      }

      .field-value {
        font-weight: var(--font-weight-semi-bold, 600);
        font-size: var(--font-size-md, 16px);
        color: var(--mfe-text, #1d2b36);
      }

      .section-note {
        display: grid;
        gap: var(--mfe-space-1, 4px);
        padding: var(--mfe-space-3, 12px);
        border-radius: var(--mfe-radius-md, 12px);
        border: 1px dashed var(--mfe-border-strong, #d5dae2);
        background: var(--mfe-surface, #ffffff);
      }

      .section-title {
        margin: 0;
        font-size: var(--font-size-xs, 12px);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--mfe-text-muted, #51606a);
        font-weight: var(--font-weight-semi-bold, 600);
      }

      .section-subtitle {
        margin: 0;
        color: var(--mfe-text-muted, #51606a);
      }

      .placeholder-tab {
        padding: var(--mfe-space-6, 32px);
        text-align: center;
        color: var(--mfe-text-muted, #51606a);
        font-style: italic;
        background: var(--mfe-surface, #ffffff);
        border-radius: var(--mfe-radius-md, 12px);
        border: 1px dashed var(--mfe-border, #e5e9ef);
        margin: var(--mfe-space-4, 16px);
      }

      @media (max-width: 960px) {
        .gde-screen {
          padding: var(--mfe-space-4, 16px);
        }
      }

      @media (max-width: 900px) {
        .col-3 {
          grid-column: span 6;
        }
      }

      @media (max-width: 640px) {
        .col-3 {
          grid-column: span 12;
        }
      }
    `
  ]
})
export class InstallmentCreateComponent {
  private readonly drawerService = inject(DrawerService, { optional: true });

  readonly drawerAvailable = !!this.drawerService;

  openDrawer(): void {
    if (!this.drawerService) {
      return;
    }

    this.drawerService.open(InstallmentDrawerContentComponent, {
      title: 'Detalhe do envio',
      subtitle: 'Resumo da parcela selecionada.',
      sectionTitle: 'Resumo da parcela',
      size: 'lg',
      data: {
        vencimento: '19/12/2025',
        forma: 'Convenios e tributos',
        valor: 'R$ 37,02',
        status: 'Sem atraso'
      }
    });
  }
}

@Component({
  selector: 'app-installment-drawer-content',
  standalone: true,
  imports: [MatButtonModule, ActionBarComponent],
  template: `
    <section class="drawer-content">
      <div class="drawer-summary">
        <div class="summary-item">
          <span class="field-label">Data vencimento</span>
          <span class="field-value">{{ data?.vencimento }}</span>
        </div>
        <div class="summary-item">
          <span class="field-label">Forma de pagamento</span>
          <span class="field-value">{{ data?.forma }}</span>
        </div>
        <div class="summary-item">
          <span class="field-label">Valor pagamento</span>
          <span class="field-value">{{ data?.valor }}</span>
        </div>
        <div class="summary-item">
          <span class="field-label">Status</span>
          <span class="field-value">{{ data?.status }}</span>
        </div>
      </div>

      <lib-action-bar>
        <div action-bar-summary class="drawer-summary-hint">
          <span>Confirme as informacoes antes de salvar.</span>
        </div>
        <div action-bar-actions>
          <button mat-stroked-button color="primary" type="button" (click)="close()">
            Fechar
          </button>
          <button mat-raised-button color="primary" type="button">
            Confirmar
          </button>
        </div>
      </lib-action-bar>
    </section>
  `,
  styles: [
    `
      .drawer-content {
        display: grid;
        gap: var(--mfe-space-4, 16px);
      }

      .drawer-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--mfe-space-3, 12px);
      }

      .summary-item {
        display: grid;
        gap: var(--mfe-space-1, 4px);
        padding: var(--mfe-space-3, 12px);
        border-radius: var(--mfe-radius-md, 12px);
        background: var(--mfe-surface-muted, #f6f7f9);
        border: 1px solid var(--mfe-border, #e5e9ef);
      }

      .field-label {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--mfe-text-muted, #51606a);
      }

      .field-value {
        font-weight: 600;
        color: var(--mfe-text, #1d2b36);
      }

      .drawer-summary-hint {
        font-weight: 600;
      }
    `
  ]
})
export class InstallmentDrawerContentComponent {
  private readonly drawerRef = inject(DrawerRef, { optional: true });
  readonly data = inject(DRAWER_DATA, { optional: true }) as {
    vencimento?: string;
    forma?: string;
    valor?: string;
    status?: string;
  } | null;

  close(): void {
    this.drawerRef?.close();
  }
}
