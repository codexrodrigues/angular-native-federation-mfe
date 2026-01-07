import { Component, EventEmitter, HostBinding, Input, Output, OnInit, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { OverlayContainer } from '@angular/cdk/overlay';

type ContractDrawerData = {
  contratoId: string;
  conta: string;
  cooperado: string;
  cooperativa: string;
  agencia: string;
};

type ContractDrawerIntent = {
  kind: 'contract-drawer';
  version: '1.0';
  origin: string;
  correlationId: string;
  data: ContractDrawerData;
};

type ShellApiBridge = {
  openDrawer: (intent: ContractDrawerIntent) => Promise<unknown>;
  capabilities: () => { supportedIntents: Array<{ kind: string; versions: string[] }> };
  navigate: (path: string) => Promise<boolean>;
  track: (event: ShellTelemetryEvent) => void;
  toast: (payload: ShellToastPayload) => void;
};

type ShellContext = {
  userId: string;
  locale: string;
  theme: string;
  route: string;
  updatedAt?: string;
};

type ShellTelemetryEvent = {
  name: string;
  level?: 'info' | 'warn' | 'error';
  data?: Record<string, unknown>;
  durationMs?: number;
};

type ShellToastPayload = {
  message: string;
  title?: string;
  level?: 'info' | 'success' | 'warning' | 'error';
  durationMs?: number;
};

type CreditoView = 'simulacao' | 'analise' | 'painel';

type DashboardCard = {
  label: string;
  value: string;
  meta?: string;
};

type DashboardNote = {
  title: string;
  value: string;
  body: string;
};

type DashboardRow = {
  id: string;
  name: string;
  status: string;
  value: number;
};

const normalizeCreditoView = (value?: string): CreditoView => {
  if (!value) {
    return 'simulacao';
  }

  switch (value.trim().toLowerCase()) {
    case 'analise':
      return 'analise';
    case 'painel':
    case 'dashboard':
      return 'painel';
    default:
      return 'simulacao';
  }
};

@Component({
  selector: 'app-credito-element',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatRadioModule,
    MatSelectModule,
    MatSlideToggleModule
  ],
  template: `
    <section class="credito-card">
      <header class="credito-card__header">
        <div>
          <p class="credito-card__eyebrow">{{ viewLabel() }}</p>
          <h2>Remote Credito (Angular 19)</h2>
          <p class="credito-card__subtitle">{{ viewSubtitle() }}</p>
        </div>
        <span class="credito-card__badge">POC</span>
      </header>

      <div class="credito-card__body">
        <div class="credito-card__stat">
          <span>Usuario</span>
          <strong>{{ shellContext?.userId || userId || 'N/A' }}</strong>
        </div>
        <div class="credito-card__stat">
          <span>Status</span>
          <strong>Pronto</strong>
        </div>
        <div class="credito-card__stat">
          <span>Versao</span>
          <strong>Angular 19</strong>
        </div>
      </div>

      @if (shellContext) {
        <div class="credito-card__context">
          <div class="credito-card__context-item">
            <span>Theme</span>
            <strong>{{ shellContext.theme }}</strong>
          </div>
          <div class="credito-card__context-item">
            <span>Locale</span>
            <strong>{{ shellContext.locale }}</strong>
          </div>
          <div class="credito-card__context-item">
            <span>Route</span>
            <strong>{{ shellContext.route }}</strong>
          </div>
        </div>
      }

      @if (supportedIntents().length) {
        <div class="credito-card__intents">
          <span>Intents suportados</span>
          <div class="credito-card__badges">
            @for (intent of supportedIntents(); track intent) {
              <span class="credito-card__badge-chip">{{ intent }}</span>
            }
          </div>
        </div>
      }

      <mat-divider></mat-divider>

      @switch (currentView) {
        @case ('analise') {
          <section class="credito-dashboard">
            <header class="credito-dashboard__header">
              <div>
                <h3>Analise de risco</h3>
                <p>Indicadores calculados a partir da simulacao atual.</p>
              </div>
              <span class="credito-dashboard__pill">
                Perfil {{ getRiskLabel(form.controls.risco.value) }}
              </span>
            </header>

            <div class="credito-dashboard__grid">
              @for (card of analiseCards(); track card.label) {
                <article class="credito-kpi">
                  <span>{{ card.label }}</span>
                  <strong>{{ card.value }}</strong>
                  @if (card.meta) {
                    <small>{{ card.meta }}</small>
                  }
                </article>
              }
            </div>

            <div class="credito-dashboard__notes">
              @for (note of analiseNotes; track note.title) {
                <article class="credito-note">
                  <span>{{ note.title }}</span>
                  <strong>{{ note.value }}</strong>
                  <p>{{ note.body }}</p>
                </article>
              }
            </div>
          </section>
        }
        @case ('painel') {
          <section class="credito-dashboard">
            <header class="credito-dashboard__header">
              <div>
                <h3>Painel da carteira</h3>
                <p>Acompanhamento rapido das simulacoes em andamento.</p>
              </div>
              <span class="credito-dashboard__pill">Ultimas 24h</span>
            </header>

            <div class="credito-dashboard__grid">
              @for (card of painelCards(); track card.label) {
                <article class="credito-kpi">
                  <span>{{ card.label }}</span>
                  <strong>{{ card.value }}</strong>
                  @if (card.meta) {
                    <small>{{ card.meta }}</small>
                  }
                </article>
              }
            </div>

            <div class="credito-dashboard__list">
              <div class="credito-dashboard__list-header">
                <span>Ultimas simulacoes</span>
                <span>Status</span>
                <span>Valor</span>
              </div>
              @for (row of painelRows; track row.id) {
                <div class="credito-dashboard__list-row">
                  <span>{{ row.name }}</span>
                  <span class="credito-dashboard__tag" [class.is-muted]="row.status === 'Em analise'">
                    {{ row.status }}
                  </span>
                  <span>{{ formatCurrency(row.value) }}</span>
                </div>
              }
            </div>
          </section>
        }
        @default {
          <form class="credito-form" [formGroup]="form" (ngSubmit)="submitSimulation()">
        <div class="credito-form__section">
          <div class="credito-form__section-header">
            <h3>Dados do cooperado</h3>
            <span>Informacoes basicas para o cadastro.</span>
          </div>
          <div class="credito-form__grid">
            <mat-form-field appearance="outline">
              <mat-label>Nome completo</mat-label>
              <input matInput formControlName="nome" placeholder="Ex: Ana Souza" />
              @if (form.controls.nome.touched && form.controls.nome.hasError('required')) {
                <mat-error>Campo obrigatorio</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>CPF</mat-label>
              <input matInput formControlName="cpf" placeholder="000.000.000-00" />
              <mat-hint>Somente numeros.</mat-hint>
              @if (form.controls.cpf.touched && form.controls.cpf.hasError('required')) {
                <mat-error>Campo obrigatorio</mat-error>
              }
              @if (form.controls.cpf.touched && form.controls.cpf.hasError('pattern')) {
                <mat-error>Formato invalido</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Conta corrente</mat-label>
              <input matInput formControlName="conta" placeholder="93458-7" />
              <mat-hint>Opcional</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Cooperativa</mat-label>
              <input matInput formControlName="cooperativa" placeholder="Coop Central" />
              @if (form.controls.cooperativa.touched && form.controls.cooperativa.hasError('required')) {
                <mat-error>Campo obrigatorio</mat-error>
              }
            </mat-form-field>
          </div>
        </div>

        <mat-divider></mat-divider>

        <div class="credito-form__section">
          <div class="credito-form__section-header">
            <h3>Simulacao de credito</h3>
            <span>Parametros para calculo rapido.</span>
          </div>
          <div class="credito-form__grid">
            <mat-form-field appearance="outline">
              <mat-label>Renda mensal</mat-label>
              <span matPrefix>R$&nbsp;</span>
              <input matInput type="number" formControlName="renda" />
              @if (form.controls.renda.touched && form.controls.renda.hasError('min')) {
                <mat-error>Minimo R$ 500</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Limite solicitado</mat-label>
              <span matPrefix>R$&nbsp;</span>
              <input matInput type="number" formControlName="limite" />
              @if (form.controls.limite.touched && form.controls.limite.hasError('min')) {
                <mat-error>Minimo R$ 1.000</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Produto</mat-label>
              <mat-select formControlName="produto">
                @for (option of productOptions; track option.value) {
                  <mat-option [value]="option.value">{{ option.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Prazo</mat-label>
              <mat-select formControlName="prazo">
                @for (option of prazoOptions; track option) {
                  <mat-option [value]="option">{{ option }} meses</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Data de inicio</mat-label>
              <input matInput [matDatepicker]="inicioPicker" formControlName="inicio" />
              <mat-datepicker-toggle matSuffix [for]="inicioPicker"></mat-datepicker-toggle>
              <mat-datepicker #inicioPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Canal</mat-label>
              <mat-select formControlName="canal">
                @for (option of canalOptions; track option.value) {
                  <mat-option [value]="option.value">{{ option.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <div class="credito-form__toggles">
            <mat-slide-toggle formControlName="seguro">Seguro prestamista</mat-slide-toggle>
            <mat-checkbox formControlName="oferta">Aceitar ofertas personalizadas</mat-checkbox>
          </div>

          <div class="credito-form__radios">
            <span class="credito-form__label">Perfil de risco</span>
            <mat-radio-group class="credito-form__radio-group" formControlName="risco">
              @for (option of riscoOptions; track option.value) {
                <mat-radio-button [value]="option.value">{{ option.label }}</mat-radio-button>
              }
            </mat-radio-group>
          </div>
        </div>

        <div class="credito-form__summary">
          <div class="credito-form__summary-header">
            <div>
              <span class="credito-form__summary-kicker">Resumo rapido</span>
              <h4>Parametros da simulacao</h4>
            </div>
            <span class="credito-form__summary-pill">
              {{ formatPercent(getRiskRate(form.controls.risco.value)) }}
            </span>
          </div>
          <div class="credito-form__summary-grid">
            <div>
              <span>Produto</span>
              <strong>{{ getProductLabel(form.controls.produto.value) }}</strong>
            </div>
            <div>
              <span>Prazo</span>
              <strong>{{ form.controls.prazo.value }} meses</strong>
            </div>
            <div>
              <span>Limite</span>
              <strong>{{ formatCurrency(form.controls.limite.value) }}</strong>
            </div>
            <div>
              <span>Renda</span>
              <strong>{{ formatCurrency(form.controls.renda.value) }}</strong>
            </div>
          </div>
          <div class="credito-form__summary-footer">
            <span>Parcela estimada</span>
            <strong>{{ formatCurrency(estimateInstallment()) }}</strong>
          </div>
        </div>

        <div class="credito-form__actions">
          <button mat-raised-button color="primary" type="submit">Simular</button>
          <button mat-stroked-button type="button" (click)="resetForm()">Limpar</button>
        </div>

        <div class="credito-form__shell-actions">
          <span class="credito-form__label">Integracao com o shell</span>
          <div class="credito-form__shell-buttons">
            <button mat-button type="button" (click)="openContractDrawer()">
              Abrir drawer do contrato
            </button>
            <button mat-button type="button" (click)="navigateToContaCorrente()">
              Ir para Conta Corrente
            </button>
            <button mat-button type="button" (click)="sendTelemetry()">Enviar telemetria</button>
            <button mat-button type="button" (click)="showToast()">Mostrar toast</button>
          </div>
        </div>
      </form>
        }
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        font-family: var(--font-base, "Roboto", "Helvetica Neue", Arial, sans-serif);
        color: var(--mfe-text, #1d2b36);
      }

      .credito-card {
        display: grid;
        gap: 16px;
        padding: 20px;
        border-radius: 16px;
        border: 1px solid var(--mfe-border, #e5e9ef);
        background: var(--mfe-surface, #ffffff);
        box-shadow: var(--mfe-card-shadow, 0px 2px 6px rgba(0, 30, 36, 0.08));
      }

      .credito-card__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }

      .credito-card__eyebrow {
        margin: 0 0 4px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--mfe-text-muted, #51606a);
        font-weight: 600;
      }

      .credito-card__header h2 {
        margin: 0 0 6px;
        font-size: 20px;
      }

      .credito-card__subtitle {
        margin: 0;
        color: var(--mfe-text-muted, #51606a);
      }

      .credito-card__badge {
        border-radius: 999px;
        padding: 4px 12px;
        font-size: 12px;
        font-weight: 600;
        border: 1px solid
          color-mix(in srgb, var(--mfe-primary, #2f6fed) 30%, var(--mfe-surface, #ffffff));
        color: var(--mfe-primary, #2f6fed);
        background: color-mix(
          in srgb,
          var(--mfe-primary, #2f6fed) 12%,
          var(--mfe-surface, #ffffff)
        );
      }

      .credito-card__body {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      }

      .credito-card__context {
        display: grid;
        gap: 8px;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        padding: 12px;
        border-radius: 12px;
        border: 1px dashed var(--mfe-border, #e5e9ef);
        background: color-mix(
          in srgb,
          var(--mfe-primary, #2f6fed) 6%,
          var(--mfe-surface, #ffffff)
        );
      }

      .credito-card__context-item {
        display: grid;
        gap: 4px;
      }

      .credito-card__context-item span {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--mfe-text-muted, #51606a);
      }

      .credito-card__context-item strong {
        font-size: 14px;
        color: var(--mfe-text, #1d2b36);
      }

      .credito-card__intents {
        display: grid;
        gap: 8px;
      }

      .credito-card__intents span {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--mfe-text-muted, #51606a);
      }

      .credito-card__badges {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .credito-card__badge-chip {
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 11px;
        border: 1px solid
          color-mix(in srgb, var(--mfe-primary, #2f6fed) 25%, var(--mfe-surface, #ffffff));
        color: var(--mfe-primary, #2f6fed);
        background: color-mix(
          in srgb,
          var(--mfe-primary, #2f6fed) 10%,
          var(--mfe-surface, #ffffff)
        );
      }

      .credito-card__stat {
        display: grid;
        gap: 4px;
        padding: 12px;
        border-radius: 12px;
        border: 1px solid var(--mfe-border, #e5e9ef);
        background: var(--mfe-surface-muted, #f6f7f9);
      }

      .credito-card__stat span {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--mfe-text-muted, #51606a);
      }

      .credito-card__stat strong {
        font-size: 16px;
        color: var(--mfe-text, #1d2b36);
      }

      .credito-form {
        display: grid;
        gap: 16px;
      }

      .credito-form mat-form-field {
        width: 100%;
      }

      .credito-form__section {
        display: grid;
        gap: 12px;
      }

      .credito-form__section-header {
        display: grid;
        gap: 4px;
      }

      .credito-form__section-header h3 {
        margin: 0;
        font-size: 1rem;
      }

      .credito-form__section-header span {
        font-size: 0.75rem;
        color: var(--mfe-text-muted, #51606a);
      }

      .credito-form__grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }

      .credito-form__toggles {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        align-items: center;
      }

      .credito-form__radios {
        display: grid;
        gap: 8px;
      }

      .credito-form__label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--mfe-text-muted, #51606a);
        font-weight: 600;
      }

      .credito-form__radio-group {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      .credito-form__summary {
        display: grid;
        gap: 12px;
        padding: 16px;
        border-radius: 12px;
        border: 1px solid var(--mfe-border, #e5e9ef);
        background: color-mix(
          in srgb,
          var(--mfe-primary, #2f6fed) 6%,
          var(--mfe-surface, #ffffff)
        );
      }

      .credito-form__summary-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }

      .credito-form__summary-header h4 {
        margin: 0;
        font-size: 1rem;
      }

      .credito-form__summary-kicker {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--mfe-text-muted, #51606a);
      }

      .credito-form__summary-pill {
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 0.7rem;
        font-weight: 600;
        border: 1px solid
          color-mix(in srgb, var(--mfe-primary, #2f6fed) 30%, var(--mfe-surface, #ffffff));
        color: var(--mfe-primary, #2f6fed);
        background: color-mix(
          in srgb,
          var(--mfe-primary, #2f6fed) 12%,
          var(--mfe-surface, #ffffff)
        );
      }

      .credito-form__summary-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      }

      .credito-form__summary-grid span {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--mfe-text-muted, #51606a);
      }

      .credito-form__summary-grid strong {
        font-size: 0.9rem;
        color: var(--mfe-text, #1d2b36);
      }

      .credito-form__summary-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-top: 1px dashed var(--mfe-border, #e5e9ef);
        padding-top: 12px;
        font-weight: 600;
      }

      .credito-form__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      .credito-form__shell-actions {
        display: grid;
        gap: 8px;
      }

      .credito-form__shell-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .credito-dashboard {
        display: grid;
        gap: 16px;
      }

      .credito-dashboard__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }

      .credito-dashboard__header h3 {
        margin: 0 0 4px;
        font-size: 1.05rem;
      }

      .credito-dashboard__header p {
        margin: 0;
        font-size: 0.78rem;
        color: var(--mfe-text-muted, #51606a);
      }

      .credito-dashboard__pill {
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 0.7rem;
        font-weight: 600;
        border: 1px solid
          color-mix(in srgb, var(--mfe-primary, #2f6fed) 30%, var(--mfe-surface, #ffffff));
        color: var(--mfe-primary, #2f6fed);
        background: color-mix(
          in srgb,
          var(--mfe-primary, #2f6fed) 12%,
          var(--mfe-surface, #ffffff)
        );
      }

      .credito-dashboard__grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      }

      .credito-kpi {
        display: grid;
        gap: 6px;
        padding: 12px;
        border-radius: 12px;
        border: 1px solid var(--mfe-border, #e5e9ef);
        background: var(--mfe-surface-muted, #f6f7f9);
      }

      .credito-kpi span {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--mfe-text-muted, #51606a);
      }

      .credito-kpi strong {
        font-size: 0.95rem;
        color: var(--mfe-text, #1d2b36);
      }

      .credito-kpi small {
        font-size: 0.72rem;
        color: var(--mfe-text-muted, #51606a);
      }

      .credito-dashboard__notes {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }

      .credito-note {
        display: grid;
        gap: 6px;
        padding: 12px;
        border-radius: 12px;
        border: 1px dashed var(--mfe-border, #e5e9ef);
        background: color-mix(
          in srgb,
          var(--mfe-primary, #2f6fed) 6%,
          var(--mfe-surface, #ffffff)
        );
      }

      .credito-note span {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--mfe-text-muted, #51606a);
      }

      .credito-note strong {
        font-size: 0.9rem;
        color: var(--mfe-text, #1d2b36);
      }

      .credito-note p {
        margin: 0;
        font-size: 0.76rem;
        color: var(--mfe-text-muted, #51606a);
      }

      .credito-dashboard__list {
        display: grid;
        gap: 8px;
      }

      .credito-dashboard__list-header,
      .credito-dashboard__list-row {
        display: grid;
        grid-template-columns: 1.3fr 0.8fr 0.7fr;
        gap: 10px;
        align-items: center;
      }

      .credito-dashboard__list-header {
        font-size: 0.68rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--mfe-text-muted, #51606a);
      }

      .credito-dashboard__list-row {
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid var(--mfe-border, #e5e9ef);
        background: var(--mfe-surface, #ffffff);
        font-size: 0.82rem;
        color: var(--mfe-text, #1d2b36);
      }

      .credito-dashboard__tag {
        justify-self: start;
        border-radius: 999px;
        padding: 2px 8px;
        font-size: 0.7rem;
        font-weight: 600;
        border: 1px solid
          color-mix(in srgb, var(--mfe-primary, #2f6fed) 25%, var(--mfe-surface, #ffffff));
        color: var(--mfe-primary, #2f6fed);
        background: color-mix(
          in srgb,
          var(--mfe-primary, #2f6fed) 10%,
          var(--mfe-surface, #ffffff)
        );
      }

      .credito-dashboard__tag.is-muted {
        color: var(--mfe-text-muted, #51606a);
        border-color: var(--mfe-border, #e5e9ef);
        background: var(--mfe-surface-muted, #f6f7f9);
      }
    `
  ]
})
export class CreditoElementComponent implements OnInit {
  @Input() userId?: string;
  @Input() shellApi?: ShellApiBridge;
  @Output() creditoAction = new EventEmitter<{ action: string; payload?: unknown }>();

  private _view: CreditoView = 'simulacao';

  @Input()
  set view(value: string | undefined) {
    this._view = normalizeCreditoView(value);
    this.hostView = this._view;
  }

  get view(): CreditoView {
    return this._view;
  }

  @HostBinding('attr.data-theme') hostTheme = 'aurora-light';
  @HostBinding('attr.data-view') hostView: CreditoView = 'simulacao';
  @HostBinding('attr.data-bridge-protocol') hostBridgeProtocol = 'shell-bridge';
  @HostBinding('attr.data-bridge-version') hostBridgeVersion = '1.0.0';
  @HostBinding('attr.data-bridge-requires') hostBridgeRequires =
    'openDrawer,navigate,track,toast,capabilities';

  private _shellContext?: ShellContext;

  @Input()
  set shellContext(value: ShellContext | undefined) {
    this._shellContext = value;
    this.applyTheme(value?.theme);
  }

  get shellContext(): ShellContext | undefined {
    return this._shellContext;
  }

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly overlayContainer = inject(OverlayContainer);
  private readonly currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  private readonly themeOptions = ['aurora-light', 'aurora-dark', 'marinho-light', 'citrico-light'];

  readonly productOptions = [
    { value: 'capital-giro', label: 'Capital de giro' },
    { value: 'investimento', label: 'Investimento' },
    { value: 'consignado', label: 'Consignado' },
    { value: 'imobiliario', label: 'Credito imobiliario' }
  ];

  readonly prazoOptions = [6, 12, 18, 24, 36];

  readonly canalOptions = [
    { value: 'digital', label: 'Canal digital' },
    { value: 'agencia', label: 'Agencia' },
    { value: 'atendimento', label: 'Atendimento' }
  ];

  readonly riscoOptions = [
    { value: 'baixo', label: 'Baixo' },
    { value: 'medio', label: 'Medio' },
    { value: 'alto', label: 'Alto' }
  ];

  readonly analiseNotes: DashboardNote[] = [
    {
      title: 'Recomendacao',
      value: 'Elegivel com ajuste',
      body: 'Sugira prazo maior para reduzir a parcela.'
    },
    {
      title: 'Pontos de atencao',
      value: 'Comprometimento acima do ideal',
      body: 'Revise limite ou renda informada.'
    }
  ];

  readonly painelRows: DashboardRow[] = [
    { id: 'sim-1042', name: 'Ana Souza', status: 'Aprovada', value: 18000 },
    { id: 'sim-1043', name: 'Carlos Lima', status: 'Em analise', value: 12500 },
    { id: 'sim-1044', name: 'Marcia Lopes', status: 'Pendente', value: 9800 }
  ];

  readonly form = this.fb.group({
    nome: this.fb.control('', [Validators.required]),
    cpf: this.fb.control('', [
      Validators.required,
      Validators.pattern(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/)
    ]),
    conta: this.fb.control(''),
    cooperativa: this.fb.control('Coop Central', [Validators.required]),
    renda: this.fb.control(8000, [Validators.required, Validators.min(500)]),
    limite: this.fb.control(15000, [Validators.required, Validators.min(1000)]),
    produto: this.fb.control('capital-giro', [Validators.required]),
    prazo: this.fb.control(12, [Validators.required]),
    inicio: this.fb.control(new Date(), [Validators.required]),
    canal: this.fb.control('digital', [Validators.required]),
    seguro: this.fb.control(true),
    oferta: this.fb.control(false),
    risco: this.fb.control('medio', [Validators.required])
  });

  ngOnInit(): void {
    this.applyTheme(this._shellContext?.theme);
  }

  async openContractDrawer(): Promise<void> {
    const intent = this.buildContractIntent();
    if (this.shellApi) {
      try {
        const result = await this.shellApi.openDrawer(intent);
        this.creditoAction.emit({ action: 'drawer-result', payload: result });
        this.handleDrawerResult(result);
      } catch (error) {
        const message = (error as Error).message ?? 'Erro ao abrir drawer';
        this.creditoAction.emit({ action: 'drawer-error', payload: { message } });
        this.emitToast({
          title: 'Credito',
          message,
          level: 'error'
        });
      }
      return;
    }

    this.creditoAction.emit({ action: 'open-contract-drawer', payload: intent });
  }

  async navigateToContaCorrente(): Promise<void> {
    const path = '/conta-corrente';
    if (this.shellApi) {
      await this.shellApi.navigate(path);
      return;
    }

    this.creditoAction.emit({ action: 'navigate', payload: { path } });
  }

  sendTelemetry(): void {
    const event: ShellTelemetryEvent = {
      name: 'credito.widget.action',
      level: 'info',
      data: {
        action: 'telemetry-demo',
        source: 'remote-credito',
        timestamp: Date.now()
      }
    };

    if (this.shellApi) {
      this.shellApi.track(event);
      return;
    }

    this.creditoAction.emit({ action: 'telemetry', payload: event });
  }

  showToast(): void {
    this.emitToast({
      title: 'Credito',
      message: 'Integracao ativa com o shell.',
      level: 'success',
      durationMs: 3500
    });
  }

  submitSimulation(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.emitToast({
        title: 'Credito',
        message: 'Preencha os campos obrigatorios.',
        level: 'warning'
      });
      return;
    }

    const payload = this.form.getRawValue();
    this.creditoAction.emit({ action: 'simulation', payload });
    this.emitToast({
      title: 'Credito',
      message: `Simulacao enviada para ${payload.nome}.`,
      level: 'success'
    });
  }

  resetForm(): void {
    this.form.reset({
      nome: '',
      cpf: '',
      conta: '',
      cooperativa: 'Coop Central',
      renda: 8000,
      limite: 15000,
      produto: 'capital-giro',
      prazo: 12,
      inicio: new Date(),
      canal: 'digital',
      seguro: true,
      oferta: false,
      risco: 'medio'
    });
  }

  get currentView(): CreditoView {
    return this._view;
  }

  viewLabel(): string {
    switch (this._view) {
      case 'analise':
        return 'Analise de risco';
      case 'painel':
        return 'Painel da carteira';
      default:
        return 'Simulacao';
    }
  }

  viewSubtitle(): string {
    switch (this._view) {
      case 'analise':
        return 'Leitura de risco e comprometimento da proposta.';
      case 'painel':
        return 'Indicadores da carteira e funil de simulacoes.';
      default:
        return 'Simulacao e cadastro do cooperado.';
    }
  }

  analiseCards(): DashboardCard[] {
    const renda = this.form.controls.renda.value ?? 0;
    const limite = this.form.controls.limite.value ?? 0;
    const risco = this.form.controls.risco.value;
    const canal = this.form.controls.canal.value;

    return [
      {
        label: 'Perfil de risco',
        value: this.getRiskLabel(risco),
        meta: `Taxa ${this.formatPercent(this.getRiskRate(risco))}`
      },
      {
        label: 'Comprometimento',
        value: this.formatPercentPlain(this.getCommitmentRate()),
        meta: `Renda ${this.formatCurrency(renda)}`
      },
      {
        label: 'Limite recomendado',
        value: this.formatCurrency(this.getSuggestedLimit()),
        meta: `Solicitado ${this.formatCurrency(limite)}`
      },
      {
        label: 'Canal preferido',
        value: this.getChannelLabel(canal),
        meta: 'Baseado na simulacao'
      }
    ];
  }

  painelCards(): DashboardCard[] {
    const renda = this.form.controls.renda.value ?? 0;
    const limite = this.form.controls.limite.value ?? 0;
    const canal = this.form.controls.canal.value;

    return [
      {
        label: 'Propostas no mes',
        value: '128',
        meta: '16 pendentes'
      },
      {
        label: 'Aprovacao',
        value: this.formatPercentPlain(this.getApprovalRate()),
        meta: `Canal ${this.getChannelLabel(canal)}`
      },
      {
        label: 'Ticket medio',
        value: this.formatCurrency(limite),
        meta: 'Base atual'
      },
      {
        label: 'Renda media',
        value: this.formatCurrency(renda),
        meta: 'Cooperados ativos'
      }
    ];
  }

  formatCurrency(value: number): string {
    return this.currencyFormatter.format(value ?? 0);
  }

  formatPercent(value: number): string {
    if (!Number.isFinite(value)) {
      return '0% a.m.';
    }
    return `${(value * 100).toFixed(1)}% a.m.`;
  }

  formatPercentPlain(value: number): string {
    if (!Number.isFinite(value)) {
      return '0%';
    }
    return `${(value * 100).toFixed(0)}%`;
  }

  estimateInstallment(): number {
    const value = this.form.getRawValue();
    const prazo = Math.max(1, value.prazo);
    const base = value.limite / prazo;
    const rate = this.getRiskRate(value.risco);
    return Math.round((base + base * rate) * 100) / 100;
  }

  getProductLabel(value: string): string {
    return this.productOptions.find((option) => option.value === value)?.label ?? value;
  }

  getRiskLabel(value: string): string {
    return this.riscoOptions.find((option) => option.value === value)?.label ?? value;
  }

  getChannelLabel(value: string): string {
    return this.canalOptions.find((option) => option.value === value)?.label ?? value;
  }

  getRiskRate(risk: string): number {
    switch (risk) {
      case 'baixo':
        return 0.012;
      case 'alto':
        return 0.028;
      default:
        return 0.019;
    }
  }

  getCommitmentRate(): number {
    const renda = this.form.controls.renda.value ?? 0;
    const limite = this.form.controls.limite.value ?? 0;
    if (renda <= 0) {
      return 0;
    }
    const rate = limite / (renda * 2.5);
    return Math.min(1, Math.max(0, rate));
  }

  getSuggestedLimit(): number {
    const renda = this.form.controls.renda.value ?? 0;
    const risk = this.form.controls.risco.value;
    const factor = risk === 'baixo' ? 2.6 : risk === 'alto' ? 1.5 : 2.1;
    return Math.round(renda * factor * 100) / 100;
  }

  getApprovalRate(): number {
    switch (this.form.controls.risco.value) {
      case 'baixo':
        return 0.82;
      case 'alto':
        return 0.42;
      default:
        return 0.66;
    }
  }

  supportedIntents(): string[] {
    const capabilities = this.shellApi?.capabilities?.();
    if (!capabilities?.supportedIntents?.length) {
      return [];
    }
    return capabilities.supportedIntents.flatMap((intent) =>
      intent.versions.map((version) => `${intent.kind}@${version}`)
    );
  }

  private applyTheme(theme?: string): void {
    const resolved = this.resolveTheme(theme);
    this.hostTheme = resolved;
    this.syncOverlayTheme(resolved);
  }

  private resolveTheme(theme?: string): string {
    if (theme && this.themeOptions.includes(theme)) {
      return theme;
    }

    if (typeof document === 'undefined') {
      return 'aurora-light';
    }

    const root = document.documentElement;
    return this.themeOptions.find((option) => root.classList.contains(option)) ?? 'aurora-light';
  }

  private syncOverlayTheme(theme: string): void {
    if (typeof document === 'undefined') {
      return;
    }

    const container = this.overlayContainer.getContainerElement();
    if (!container) {
      return;
    }

    container.classList.add('remote-credito-overlay');
    this.themeOptions.forEach((option) => container.classList.remove(option));
    container.classList.add(theme);
    container.setAttribute('data-theme', theme);
  }

  private buildContractIntent(): ContractDrawerIntent {
    const values = this.form.getRawValue();
    return {
      kind: 'contract-drawer',
      version: '1.0',
      origin: 'remote-credito',
      correlationId: this.createCorrelationId(),
      data: {
        contratoId: 'CT-2024-001',
        conta: values.conta || '93458-7',
        cooperado: values.nome || this.shellContext?.userId || this.userId || 'USR-0042',
        cooperativa: values.cooperativa || 'Coop Central',
        agencia: '0001'
      }
    };
  }

  private createCorrelationId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `corr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }

  private handleDrawerResult(result: unknown): void {
    if (!result || typeof result !== 'object') {
      return;
    }

    const action = (result as { action?: string }).action;
    if (action === 'saved') {
      const contratoId = (result as { payload?: { contratoId?: string } }).payload?.contratoId;
      this.emitToast({
        title: 'Credito',
        message: contratoId ? `Contrato ${contratoId} salvo.` : 'Contrato salvo.',
        level: 'success'
      });
      return;
    }

    if (action === 'cancel') {
      this.emitToast({
        title: 'Credito',
        message: 'Operacao cancelada.',
        level: 'info'
      });
    }
  }

  private emitToast(payload: ShellToastPayload): void {
    if (!payload?.message) {
      return;
    }

    if (this.shellApi) {
      this.shellApi.toast(payload);
      return;
    }

    this.creditoAction.emit({ action: 'toast', payload });
  }
}
