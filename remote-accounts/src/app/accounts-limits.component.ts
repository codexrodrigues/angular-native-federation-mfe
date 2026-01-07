import { CommonModule } from '@angular/common';
import { Component, EnvironmentInjector, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActionBarComponent } from 'shared-ui-lib';
import { DRAWER_DATA, DrawerRef, DrawerService } from 'shared-logic/angular';

interface LimitItem {
  label: string;
  value: string;
  status: string;
  note: string;
}

type EditLimitsData = {
  dailyLimit: number;
  monthlyLimit: number;
  emergencyLimit: number;
  channel: string;
  validUntil: string;
  justification: string;
};

type EditLimitsResult =
  | { action: 'cancel' }
  | { action: 'saved'; payload: EditLimitsData };

type ReleaseRequestData = {
  blockType: string;
  protocolId: string;
  contactName: string;
  requestedAmount: number;
  untilDate: string;
  justification: string;
  priority: 'Alta' | 'Media' | 'Baixa';
};

type ReleaseRequestResult =
  | { action: 'cancel' }
  | { action: 'submitted'; payload: ReleaseRequestData };

@Component({
  selector: 'app-accounts-limits',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `
    <section class="accounts-limits">
      <header class="limits-header">
        <div>
          <p class="eyebrow">Seguranca</p>
          <h2>Limites e bloqueios</h2>
          <p>Controle limites operacionais e restricoes aplicadas ao cooperado.</p>
        </div>
        <div class="limits-actions">
          <button mat-stroked-button color="primary" type="button" (click)="openEditLimits()">
            Editar limites
          </button>
          <button mat-raised-button color="primary" type="button" (click)="openReleaseRequest()">
            Solicitar liberacao
          </button>
        </div>
      </header>

      <div class="limits-grid">
        @for (limit of limits; track limit.label) {
          <div class="limit-card">
            <span class="limit-label">{{ limit.label }}</span>
            <strong class="limit-value">{{ limit.value }}</strong>
            <span class="limit-status">{{ limit.status }}</span>
            <span class="limit-note">{{ limit.note }}</span>
          </div>
        }
      </div>
    </section>
  `,
  styles: [
    `
      .accounts-limits {
        display: grid;
        gap: var(--spacing-xxs, 24px);
        padding: var(--spacing-xxs, 24px);
      }

      .limits-header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--spacing-xxxs, 16px);
      }

      .limits-header h2 {
        margin: 0 0 var(--spacing-quarck, 4px);
        font-size: var(--font-size-xl, 20px);
        font-weight: var(--font-weight-bold, 700);
        color: var(--color-surface-text-default-high, #002a33);
      }

      .limits-header p {
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

      .limits-actions {
        display: flex;
        align-items: center;
        gap: var(--spacing-nano, 8px);
        flex-wrap: wrap;
      }

      .limits-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: var(--spacing-xxxs, 16px);
      }

      .limit-card {
        padding: var(--spacing-xxxs, 16px);
        border-radius: var(--border-radius-md, 16px);
        background: var(--color-surface-background-low, #ffffff);
        border: 1px solid var(--color-surface-stroke-low, #f0f0f0);
        display: grid;
        gap: var(--spacing-quarck, 4px);
        box-shadow: var(--box-shadow-surface, 0px 0px 1px 0 rgba(0, 30, 36, 0.24), 0px 2px 2px 0 rgba(0, 30, 36, 0.24));
      }

      .limit-label {
        font-size: var(--font-size-xs, 12px);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--color-surface-text-default-medium, #515151);
        font-weight: var(--font-weight-medium, 500);
      }

      .limit-value {
        font-size: var(--font-size-lg, 18px);
        color: var(--color-surface-text-default-high, #002a33);
        font-weight: var(--font-weight-bold, 700);
      }

      .limit-status {
        font-weight: var(--font-weight-semi-bold, 600);
        color: var(--color-denotative-info-default, #0090e0);
        font-size: var(--font-size-sm, 14px);
      }

      .limit-note {
        font-size: var(--font-size-sm, 14px);
        color: var(--color-surface-text-default-medium, #515151);
      }
    `
  ]
})
export class AccountsLimitsComponent {
  private readonly drawerService = inject(DrawerService, { optional: true });
  private readonly environmentInjector = inject(EnvironmentInjector);

  private readonly editDefaults: EditLimitsData = {
    dailyLimit: 25000,
    monthlyLimit: 180000,
    emergencyLimit: 2000,
    channel: 'Agencia',
    validUntil: '2025-12-31',
    justification: 'Ajuste alinhado a ultima revisao de 12/12/2025.'
  };

  private readonly releaseDefaults: ReleaseRequestData = {
    blockType: 'Retencao preventiva',
    protocolId: 'SOL-2025-1217',
    contactName: 'Time de Risco',
    requestedAmount: 2000,
    untilDate: '2025-12-31',
    justification: 'Solicitacao aberta em 17/12/2025 para avaliacao.',
    priority: 'Media'
  };

  readonly limits: LimitItem[] = [
    {
      label: 'Limite diario',
      value: 'R$ 25.000,00',
      status: 'Dentro do limite',
      note: 'Ultima alteracao: 12/12/2025'
    },
    {
      label: 'Limite mensal',
      value: 'R$ 180.000,00',
      status: '80% utilizado',
      note: 'Restante: R$ 36.000,00'
    },
    {
      label: 'Bloqueio judicial',
      value: 'Nao aplicado',
      status: 'Sem bloqueios',
      note: 'Status revisado hoje'
    },
    {
      label: 'Retencao preventiva',
      value: 'R$ 2.000,00',
      status: 'Em avaliacao',
      note: 'Solicitacao aberta em 17/12/2025'
    }
  ];

  openEditLimits(): void {
    if (!this.drawerService) {
      console.warn('DrawerService indisponivel no modo standalone.');
      return;
    }

    const ref = this.drawerService.open<EditLimitsDrawerComponent, EditLimitsData, EditLimitsResult>(
      EditLimitsDrawerComponent,
      {
      title: 'Editar limites',
      subtitle: 'Ajuste de limites operacionais do cooperado.',
      sectionTitle: 'Limites configurados',
      size: 'lg',
      data: this.editDefaults,
      environmentInjector: this.environmentInjector
      }
    );

    void ref.afterClosed.then((result) => {
      if (result && result.action === 'saved') {
        console.log('[Conta Corrente] Limites atualizados', result.payload);
      }
    });
  }

  openReleaseRequest(): void {
    if (!this.drawerService) {
      console.warn('DrawerService indisponivel no modo standalone.');
      return;
    }

    const ref = this.drawerService.open<ReleaseRequestDrawerComponent, ReleaseRequestData, ReleaseRequestResult>(
      ReleaseRequestDrawerComponent,
      {
      title: 'Solicitar liberacao',
      subtitle: 'Pedido de liberacao de bloqueios operacionais.',
      sectionTitle: 'Detalhes do pedido',
      size: 'lg',
      data: this.releaseDefaults,
      environmentInjector: this.environmentInjector
      }
    );

    void ref.afterClosed.then((result) => {
      if (result && result.action === 'submitted') {
        console.log('[Conta Corrente] Solicitacao enviada', result.payload);
      }
    });
  }
}

@Component({
  selector: 'app-edit-limits-drawer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ActionBarComponent
  ],
  template: `
    <section class="drawer-form">
      <header class="drawer-header">
        <p class="eyebrow">Conta Corrente</p>
        <h3>Editar limites operacionais</h3>
        <p class="subtitle">Formulario exemplo para ajuste de limites do cooperado.</p>
      </header>

      <div class="drawer-note">
        <strong>Contexto atual</strong>
        <span>Limite diario: {{ data?.dailyLimit || 0 | currency:'BRL' }}</span>
        <span>Limite mensal: {{ data?.monthlyLimit || 0 | currency:'BRL' }}</span>
        <span>Canal sugerido: {{ data?.channel || 'Agencia' }} (ultima revisao 12/12/2025)</span>
      </div>

      <form [formGroup]="form" class="drawer-grid">
        <div class="col-6 field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Limite diario</mat-label>
            <input matInput type="number" formControlName="dailyLimit" />
          </mat-form-field>
          @if (form.get('dailyLimit')?.invalid && form.get('dailyLimit')?.touched) {
            <span class="field-error">Informe o limite diario.</span>
          }
        </div>

        <div class="col-6 field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Limite mensal</mat-label>
            <input matInput type="number" formControlName="monthlyLimit" />
          </mat-form-field>
          @if (form.get('monthlyLimit')?.invalid && form.get('monthlyLimit')?.touched) {
            <span class="field-error">Informe o limite mensal.</span>
          }
        </div>

        <div class="col-6 field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Limite emergencial</mat-label>
            <input matInput type="number" formControlName="emergencyLimit" />
          </mat-form-field>
        </div>

        <div class="col-6 field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Canal de aplicacao</mat-label>
            <mat-select formControlName="channel">
              <mat-option value="Agencia">Agencia</mat-option>
              <mat-option value="Internet Banking">Internet Banking</mat-option>
              <mat-option value="Mobile">Mobile</mat-option>
              <mat-option value="Atendimento">Atendimento</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="col-6 field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Vigencia ate</mat-label>
            <input matInput type="date" formControlName="validUntil" />
          </mat-form-field>
        </div>

        <div class="col-12 field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Justificativa</mat-label>
            <textarea matInput rows="3" formControlName="justification"></textarea>
          </mat-form-field>
        </div>
      </form>

      <lib-action-bar>
        <div action-bar-summary>Exemplo de solicitacao interna para ajuste de limites.</div>
        <div action-bar-actions>
          <button mat-stroked-button color="primary" type="button" (click)="cancel()">
            Cancelar
          </button>
          <button mat-raised-button color="primary" type="button" [disabled]="form.invalid" (click)="save()">
            Salvar ajustes
          </button>
        </div>
      </lib-action-bar>
    </section>
  `,
  styles: [
    `
      .drawer-form {
        display: grid;
        gap: var(--mfe-space-4, 16px);
      }

      .drawer-header h3 {
        margin: 0;
        font-size: var(--font-size-lg, 18px);
        color: var(--mfe-text, #1d2b36);
      }

      .drawer-header .subtitle {
        margin: var(--mfe-space-1, 4px) 0 0;
        color: var(--mfe-text-muted, #51606a);
      }

      .eyebrow {
        margin: 0 0 var(--mfe-space-1, 4px);
        font-size: var(--font-size-xs, 12px);
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--mfe-text-muted, #51606a);
        font-weight: 600;
      }

      .drawer-note {
        padding: var(--mfe-space-3, 12px);
        border-radius: var(--mfe-radius-md, 12px);
        border: 1px dashed var(--mfe-border, #e5e9ef);
        background: var(--mfe-surface, #ffffff);
        display: grid;
        gap: var(--mfe-space-1, 4px);
        font-size: var(--font-size-sm, 14px);
        color: var(--mfe-text-muted, #51606a);
      }

      .drawer-grid {
        display: grid;
        grid-template-columns: repeat(12, minmax(0, 1fr));
        gap: var(--mfe-space-3, 12px);
        align-items: end;
      }

      .field {
        display: grid;
        gap: var(--mfe-space-1, 4px);
      }

      .field-error {
        color: var(--color-denotative-error-default, #f7406c);
        font-size: 0.75rem;
      }

      .col-12 {
        grid-column: span 12;
      }

      .col-6 {
        grid-column: span 6;
      }

      .full-width {
        width: 100%;
      }

      @media (max-width: 960px) {
        .col-6 {
          grid-column: span 12;
        }
      }
    `
  ]
})
export class EditLimitsDrawerComponent {
  private readonly drawerRef = inject(DrawerRef<EditLimitsResult>, { optional: true });
  private readonly fb = inject(NonNullableFormBuilder);
  readonly data = inject(DRAWER_DATA, { optional: true }) as EditLimitsData | null;

  readonly form = this.fb.group({
    dailyLimit: [this.data?.dailyLimit ?? 0, [Validators.required, Validators.min(0)]],
    monthlyLimit: [this.data?.monthlyLimit ?? 0, [Validators.required, Validators.min(0)]],
    emergencyLimit: [this.data?.emergencyLimit ?? 0, [Validators.min(0)]],
    channel: [this.data?.channel ?? 'Agencia', [Validators.required]],
    validUntil: [this.data?.validUntil ?? '', [Validators.required]],
    justification: [this.data?.justification ?? '', [Validators.required, Validators.minLength(8)]]
  });

  cancel(): void {
    this.drawerRef?.close({ action: 'cancel' });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    const payload: EditLimitsData = {
      dailyLimit: value.dailyLimit,
      monthlyLimit: value.monthlyLimit,
      emergencyLimit: value.emergencyLimit,
      channel: value.channel,
      validUntil: value.validUntil,
      justification: value.justification
    };

    this.drawerRef?.close({ action: 'saved', payload });
  }
}

@Component({
  selector: 'app-release-request-drawer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ActionBarComponent
  ],
  template: `
    <section class="drawer-form">
      <header class="drawer-header">
        <p class="eyebrow">Conta Corrente</p>
        <h3>Solicitar liberacao</h3>
        <p class="subtitle">Formulario exemplo para pedidos de liberacao de bloqueio.</p>
      </header>

      <form [formGroup]="form" class="drawer-grid">
        <div class="col-6 field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Tipo de bloqueio</mat-label>
            <mat-select formControlName="blockType">
              <mat-option value="Bloqueio judicial">Bloqueio judicial</mat-option>
              <mat-option value="Retencao preventiva">Retencao preventiva</mat-option>
              <mat-option value="Bloqueio operacional">Bloqueio operacional</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="col-6 field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Numero do protocolo</mat-label>
            <input matInput formControlName="protocolId" />
          </mat-form-field>
        </div>

        <div class="col-6 field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Responsavel pelo pedido</mat-label>
            <input matInput formControlName="contactName" />
          </mat-form-field>
        </div>

        <div class="col-6 field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Valor solicitado</mat-label>
            <input matInput type="number" formControlName="requestedAmount" />
          </mat-form-field>
        </div>

        <div class="col-6 field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Valido ate</mat-label>
            <input matInput type="date" formControlName="untilDate" />
          </mat-form-field>
        </div>

        <div class="col-6 field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Prioridade</mat-label>
            <mat-select formControlName="priority">
              <mat-option value="Alta">Alta</mat-option>
              <mat-option value="Media">Media</mat-option>
              <mat-option value="Baixa">Baixa</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="col-12 field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Justificativa</mat-label>
            <textarea matInput rows="3" formControlName="justification"></textarea>
          </mat-form-field>
          @if (form.get('justification')?.invalid && form.get('justification')?.touched) {
            <span class="field-error">Informe a justificativa.</span>
          }
        </div>
      </form>

      <lib-action-bar>
        <div action-bar-summary>Solicitacao sera analisada pela equipe de risco.</div>
        <div action-bar-actions>
          <button mat-stroked-button color="primary" type="button" (click)="cancel()">
            Cancelar
          </button>
          <button mat-raised-button color="primary" type="button" [disabled]="form.invalid" (click)="submit()">
            Enviar solicitacao
          </button>
        </div>
      </lib-action-bar>
    </section>
  `,
  styles: [
    `
      .drawer-form {
        display: grid;
        gap: var(--mfe-space-4, 16px);
      }

      .drawer-header h3 {
        margin: 0;
        font-size: var(--font-size-lg, 18px);
        color: var(--mfe-text, #1d2b36);
      }

      .drawer-header .subtitle {
        margin: var(--mfe-space-1, 4px) 0 0;
        color: var(--mfe-text-muted, #51606a);
      }

      .eyebrow {
        margin: 0 0 var(--mfe-space-1, 4px);
        font-size: var(--font-size-xs, 12px);
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--mfe-text-muted, #51606a);
        font-weight: 600;
      }

      .drawer-grid {
        display: grid;
        grid-template-columns: repeat(12, minmax(0, 1fr));
        gap: var(--mfe-space-3, 12px);
        align-items: end;
      }

      .field {
        display: grid;
        gap: var(--mfe-space-1, 4px);
      }

      .field-error {
        color: var(--color-denotative-error-default, #f7406c);
        font-size: 0.75rem;
      }

      .col-12 {
        grid-column: span 12;
      }

      .col-6 {
        grid-column: span 6;
      }

      .full-width {
        width: 100%;
      }

      @media (max-width: 960px) {
        .col-6 {
          grid-column: span 12;
        }
      }
    `
  ]
})
export class ReleaseRequestDrawerComponent {
  private readonly drawerRef = inject(DrawerRef<ReleaseRequestResult>, { optional: true });
  private readonly fb = inject(NonNullableFormBuilder);
  readonly data = inject(DRAWER_DATA, { optional: true }) as ReleaseRequestData | null;

  readonly form = this.fb.group({
    blockType: [this.data?.blockType ?? 'Retencao preventiva', [Validators.required]],
    protocolId: [this.data?.protocolId ?? '', [Validators.required, Validators.minLength(6)]],
    contactName: [this.data?.contactName ?? '', [Validators.required, Validators.minLength(4)]],
    requestedAmount: [this.data?.requestedAmount ?? 0, [Validators.required, Validators.min(1)]],
    untilDate: [this.data?.untilDate ?? '', [Validators.required]],
    priority: [this.data?.priority ?? 'Media', [Validators.required]],
    justification: [this.data?.justification ?? '', [Validators.required, Validators.minLength(8)]]
  });

  cancel(): void {
    this.drawerRef?.close({ action: 'cancel' });
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    const payload: ReleaseRequestData = {
      blockType: value.blockType,
      protocolId: value.protocolId,
      contactName: value.contactName,
      requestedAmount: value.requestedAmount,
      untilDate: value.untilDate,
      justification: value.justification,
      priority: value.priority
    };

    this.drawerRef?.close({ action: 'submitted', payload });
  }
}
