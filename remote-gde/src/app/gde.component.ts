import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-gde-home',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  template: `
    <section class="gde-home">
      <div class="gde-hero">
        <div>
          <p class="eyebrow">GDE - Gestao de Empresas</p>
          <h2>Centralize o controle financeiro das empresas cooperadas.</h2>
          <p>
            Monitore contas a pagar, organize fornecedores e acompanhe vencimentos
            em um fluxo unico.
          </p>
        </div>
        <div class="gde-actions">
          <button mat-raised-button color="primary" routerLink="contas-a-pagar">Contas a pagar</button>
          <button mat-stroked-button color="primary">Cadastrar empresa</button>
        </div>
      </div>

      <div class="gde-panels">
        <div class="panel">
          <span class="panel-label">Empresas ativas</span>
          <strong class="panel-value">18</strong>
          <span class="panel-caption">4 cooperativas conectadas</span>
        </div>
        <div class="panel">
          <span class="panel-label">Contas vencendo</span>
          <strong class="panel-value">12</strong>
          <span class="panel-caption">Proximos 7 dias</span>
        </div>
        <div class="panel">
          <span class="panel-label">Valor em aberto</span>
          <strong class="panel-value">R$ 238,4 mil</strong>
          <span class="panel-caption">Atualizado hoje</span>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .gde-home {
        display: grid;
        align-content: start;
        grid-auto-rows: max-content;
        gap: var(--spacing-xxs, 24px);
        padding: var(--spacing-xxs, 24px);
      }

      .gde-hero {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--spacing-xxs, 24px);
        padding: var(--spacing-xxs, 24px);
        border-radius: var(--border-radius-lg, 24px);
        border: 1px solid var(--color-surface-stroke-medium, #d5dae2);
        background: var(--color-surface-background-low, #ffffff);
        box-shadow: var(--box-shadow-surface-action, 0px 4px 8px 0 rgba(0, 30, 36, 0.24));
      }

      .gde-hero h2 {
        margin: 0 0 var(--spacing-nano, 8px);
        font-size: var(--font-size-xl, 20px);
        font-weight: var(--font-weight-bold, 700);
        color: var(--color-surface-text-default-high, #002a33);
      }

      .gde-hero p {
        margin: 0;
        color: var(--color-surface-text-default-medium, #515151);
        line-height: var(--line-height-distant, 1.5);
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

      .gde-actions {
        display: flex;
        align-items: center;
        gap: var(--spacing-nano, 8px);
        flex-wrap: wrap;
      }

      .gde-panels {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--spacing-xxxs, 16px);
      }

      .panel {
        padding: var(--spacing-xxxs, 16px);
        border-radius: var(--border-radius-md, 16px);
        background: var(--color-surface-background-low, #ffffff);
        border: 1px solid var(--color-surface-stroke-low, #f0f0f0);
        box-shadow: var(--box-shadow-surface, 0px 0px 1px 0 rgba(0, 30, 36, 0.24));
      }

      .panel-label {
        display: block;
        font-size: var(--font-size-xs, 12px);
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--color-surface-text-default-medium, #515151);
        font-weight: var(--font-weight-semi-bold, 600);
      }

      .panel-value {
        display: block;
        font-size: var(--font-size-3xl, 28px);
        margin: var(--spacing-quarck, 4px) 0;
        font-weight: var(--font-weight-bold, 700);
        color: var(--color-brand-main, #2f6fed);
      }

      .panel-caption {
        font-size: var(--font-size-sm, 14px);
        color: var(--color-surface-text-default-medium, #515151);
      }
    `
  ]
})
export class GdeHomeComponent {}
