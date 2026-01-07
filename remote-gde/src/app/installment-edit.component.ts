import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-installment-edit',
  standalone: true,
  imports: [MatButtonModule, MatTabsModule],
  template: `
    <section class="gde-screen">
      <header class="screen-header">
        <div>
          <p class="eyebrow">Contas a pagar</p>
          <h2>Alteracao parcela a pagar</h2>
          <p>Ajuste dados da parcela e consolide o pagamento.</p>
        </div>
        <div class="screen-actions">
          <button mat-stroked-button color="primary" type="button">Cancelar</button>
          <button mat-raised-button color="primary" type="button">Atualizar</button>
        </div>
      </header>

      <mat-tab-group class="screen-tabs">
        <mat-tab label="Parcela">
          <div class="screen-card ds-grid">
            <div class="col-3 summary-tile">
              <span class="field-label">Data prevista pagamento</span>
              <span class="field-value">19/12/2025</span>
            </div>
            <div class="col-3 summary-tile">
              <span class="field-label">Valor total pagamento</span>
              <span class="field-value">R$ 7,33</span>
            </div>
            <div class="col-3 summary-tile">
              <span class="field-label">Status</span>
              <span class="field-value">Em revisao</span>
            </div>
            <div class="col-3 summary-tile">
              <span class="field-label">Pgt. consolidado</span>
              <span class="field-value">Nao</span>
            </div>
            <div class="col-12 section-note">
              <p class="section-title">Retorno do convenio</p>
              <p class="section-subtitle">Nenhum retorno carregado.</p>
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
export class InstallmentEditComponent {}
