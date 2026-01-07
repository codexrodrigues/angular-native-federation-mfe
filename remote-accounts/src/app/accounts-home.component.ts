import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import {
  CONTRACT_DRAWER_KIND,
  CONTRACT_DRAWER_VERSION,
  ContractDrawerData,
  ContractDrawerIntent,
  ContractDrawerResult,
  SHELL_API,
  createShellApiStub,
  createCorrelationId
} from 'shared-logic/angular';

interface AccountCard {
  label: string;
  value: string;
  caption: string;
}

@Component({
  selector: 'app-accounts-home',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `
    <section class="accounts-home">
      <header class="account-header">
        <div>
          <p class="eyebrow">Conta corrente</p>
          <h2>Gestao do cooperado</h2>
          <p>Monitore saldos, limites e situacao cadastral em tempo real.</p>
        </div>
        <div class="account-actions">
          <button
            mat-stroked-button
            color="primary"
            type="button"
            [disabled]="!drawerAvailable || drawerLoading()"
            (click)="openContractDrawer()"
          >
            @if (drawerLoading()) {
              Carregando formulario...
            } @else {
              Abrir detalhes do contrato
            }
          </button>
          <button mat-stroked-button color="primary">Bloquear conta</button>
          <button mat-raised-button color="primary">Registrar ajuste</button>
        </div>
        @if (drawerError()) {
          <div class="drawer-error">{{ drawerError() }}</div>
        }
        @if (drawerLastResult(); as result) {
          <div class="drawer-result">
            <strong>Ultimo resultado do drawer</strong>
            <span>Acao: {{ result.action }}</span>
            @if (result.action === 'saved') {
              <span>Contrato: {{ result.payload.contratoId }}</span>
            }
          </div>
        }
      </header>

      <div class="account-grid">
        @for (card of summaryCards; track card.label) {
          <div class="card">
            <span class="card-label">{{ card.label }}</span>
            <strong class="card-value">{{ card.value }}</strong>
            <span class="card-caption">{{ card.caption }}</span>
          </div>
        }
      </div>

      <div class="account-highlight">
        <div>
          <p class="highlight-label">Saldo disponivel</p>
          <p class="highlight-value">R$ 18.450,23</p>
          <p class="highlight-caption">Atualizado hoje as 09:32</p>
        </div>
        <div class="highlight-meta">
          <div>
            <span class="meta-label">Conta</span>
            <span class="meta-value">0001-9 / 19872-4</span>
          </div>
          <div>
            <span class="meta-label">Cooperativa</span>
            <span class="meta-value">Cooperativa Alfa</span>
          </div>
          <div>
            <span class="meta-label">Situacao</span>
            <span class="meta-value status">Ativa</span>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .accounts-home {
        display: grid;
        gap: var(--spacing-xxs, 24px);
        padding: var(--spacing-xxs, 24px);
      }

      .account-header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--spacing-xxxs, 16px);
      }

      .account-header h2 {
        margin: 0 0 var(--spacing-quarck, 4px);
        font-size: var(--font-size-xl, 20px);
        font-weight: var(--font-weight-bold, 700);
        color: var(--color-surface-text-default-high, #002a33);
      }

      .account-header p {
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

      .account-actions {
        display: flex;
        align-items: center;
        gap: var(--spacing-nano, 8px);
        flex-wrap: wrap;
      }

      .drawer-error {
        flex-basis: 100%;
        color: var(--color-denotative-error-default, #f7406c);
        font-size: var(--font-size-sm, 14px);
        margin-top: var(--spacing-nano, 8px);
      }

      .drawer-result {
        display: grid;
        gap: var(--spacing-quarck, 4px);
        padding: var(--spacing-xxxs, 16px);
        border-radius: var(--border-radius-md, 16px);
        background: var(--color-surface-background-low, #ffffff);
        border: 1px dashed var(--color-surface-stroke-medium, #d5dae2);
        color: var(--color-surface-text-default-medium, #515151);
        font-size: var(--font-size-sm, 14px);
      }

      .drawer-result strong {
        color: var(--color-surface-text-default-high, #002a33);
      }

      .account-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--spacing-xxxs, 16px);
      }

      .card {
        padding: var(--spacing-xxxs, 16px);
        border-radius: var(--border-radius-md, 16px);
        background: var(--color-surface-background-low, #ffffff);
        border: 1px solid var(--color-surface-stroke-low, #f0f0f0);
        display: grid;
        gap: var(--spacing-quarck, 4px);
        box-shadow: var(--box-shadow-surface, 0px 0px 1px 0 rgba(0, 30, 36, 0.24), 0px 2px 2px 0 rgba(0, 30, 36, 0.24));
      }

      .card-label {
        font-size: var(--font-size-xs, 12px);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--color-surface-text-default-medium, #515151);
        font-weight: var(--font-weight-medium, 500);
      }

      .card-value {
        font-size: var(--font-size-lg, 18px);
        color: var(--color-surface-text-default-high, #002a33);
      }

      .card-caption {
        font-size: var(--font-size-sm, 14px);
        color: var(--color-surface-text-default-medium, #515151);
      }

      .account-highlight {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--spacing-xxs, 24px);
        padding: var(--spacing-xxs, 24px);
        border-radius: var(--border-radius-lg, 24px);
        background: var(--color-surface-background-elevation-2, #f6f7f9);
        border: 1px solid var(--color-surface-stroke-low, #f0f0f0);
      }

      .highlight-label {
        margin: 0 0 var(--spacing-quarck, 4px);
        font-size: var(--font-size-xs, 12px);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--color-surface-text-default-medium, #515151);
        font-weight: var(--font-weight-semi-bold, 600);
      }

      .highlight-value {
        margin: 0;
        font-size: var(--font-size-3xl, 28px);
        font-weight: var(--font-weight-bold, 700);
        color: var(--color-brand-main, #2f6fed);
      }

      .highlight-caption {
        margin: var(--spacing-nano, 8px) 0 0;
        color: var(--color-surface-text-default-medium, #515151);
        font-size: var(--font-size-sm, 14px);
      }

      .highlight-meta {
        display: grid;
        gap: var(--spacing-nano, 8px);
      }

      .meta-label {
        display: block;
        font-size: var(--font-size-xs, 12px);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--color-surface-text-default-medium, #515151);
      }

      .meta-value {
        font-weight: var(--font-weight-semi-bold, 600);
        color: var(--color-surface-text-default-high, #002a33);
        font-size: var(--font-size-sm, 14px);
      }

      .status {
        color: var(--color-denotative-success-default, #7db61c);
      }
    `
  ]
})
export class AccountsHomeComponent implements OnInit {
  private readonly shellApi = inject(SHELL_API, { optional: true }) ?? createShellApiStub();
  private readonly route = inject(ActivatedRoute);
  readonly drawerAvailable = this.shellApi.capabilities().supportedIntents.length > 0;
  readonly drawerLoading = signal(false);
  readonly drawerError = signal<string | null>(null);
  readonly drawerLastResult = signal<ContractDrawerResult | null>(null);

  private readonly contractDrawerData: ContractDrawerData = {
    contratoId: 'CTR-2025-0042',
    conta: '0001-9 / 19872-4',
    cooperado: 'Pessoa Exemplo',
    cooperativa: 'Cooperativa Alfa',
    agencia: '0001 - Centro'
  };

  readonly summaryCards: AccountCard[] = [
    {
      label: 'Cooperado',
      value: 'Pessoa Exemplo',
      caption: 'CPF 000.000.000-00'
    },
    {
      label: 'Agencia',
      value: '0001 - Centro',
      caption: 'Perfil Backoffice'
    },
    {
      label: 'Relacionamento',
      value: '12 anos',
      caption: 'Ultima atualizacao: 18/12/2025'
    }
  ];

  ngOnInit(): void {
    const drawerParam = this.route.snapshot.queryParamMap.get('drawer');
    if (drawerParam === 'contract' && this.drawerAvailable) {
      void this.openContractDrawer();
    }
  }

  async openContractDrawer(): Promise<void> {
    if (this.drawerLoading()) {
      return;
    }

    this.drawerError.set(null);
    this.drawerLastResult.set(null);

    this.drawerLoading.set(true);

    try {
      const intent: ContractDrawerIntent = {
        kind: CONTRACT_DRAWER_KIND,
        version: CONTRACT_DRAWER_VERSION,
        origin: 'remote-accounts',
        correlationId: createCorrelationId(),
        data: this.contractDrawerData
      };

      const result = await this.shellApi.openDrawer(intent);
      if (result) {
        this.drawerLastResult.set(result);
        console.log('[Conta Corrente] Resultado do drawer', result);
      }
    } catch (error) {
      console.error('[Conta Corrente] Falha ao abrir drawer do GDE', error);
      this.drawerError.set('Nao foi possivel abrir o drawer do GDE.');
    } finally {
      this.drawerLoading.set(false);
    }
  }
}
