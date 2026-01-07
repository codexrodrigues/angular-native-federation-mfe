import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import {
  ContractDrawerData,
  ContractDrawerResult,
  ContractFormPayload,
  DRAWER_DATA,
  DrawerRef
} from 'shared-logic/angular';
import { ActionBarComponent } from 'shared-ui-lib';

@Component({
  selector: 'app-contract-drawer-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatSelectModule,
    ActionBarComponent
  ],
  template: `
    <section class="contract-drawer">
      <header class="contract-header">
        <p class="eyebrow">GDE / Contrato</p>
        <h3>Formulario de contrato</h3>
        <p class="subtitle">
          Conteudo carregado pelo remote GDE e aberto dentro do drawer do Host.
        </p>
      </header>

      <div class="drawer-note">
        <strong>Entrada via DRAWER_DATA</strong>
        <span>
          Contrato: {{ data?.contratoId || '-' }} |
          Cooperado: {{ data?.cooperado || '-' }}
        </span>
      </div>

      <form [formGroup]="form" class="contract-form">
        <div class="col-6 field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Contrato *</mat-label>
            <input matInput formControlName="contratoId" />
          </mat-form-field>
          @if (form.get('contratoId')?.invalid && form.get('contratoId')?.touched) {
            <span class="field-error">Informe o contrato.</span>
          }
        </div>

        <div class="col-6 field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Cooperado *</mat-label>
            <input matInput formControlName="cooperado" />
          </mat-form-field>
          @if (form.get('cooperado')?.invalid && form.get('cooperado')?.touched) {
            <span class="field-error">Informe o cooperado.</span>
          }
        </div>

        <div class="col-6 field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Conta *</mat-label>
            <input matInput formControlName="conta" />
          </mat-form-field>
          @if (form.get('conta')?.invalid && form.get('conta')?.touched) {
            <span class="field-error">Informe a conta.</span>
          }
        </div>

        <div class="col-6 field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Cooperativa</mat-label>
            <input matInput formControlName="cooperativa" />
          </mat-form-field>
        </div>

        <div class="col-6 field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Agencia</mat-label>
            <input matInput formControlName="agencia" />
          </mat-form-field>
        </div>

        <div class="col-6 field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Modalidade *</mat-label>
            <mat-select formControlName="modalidade">
              @for (modalidade of modalidades; track modalidade) {
                <mat-option [value]="modalidade">{{ modalidade }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          @if (form.get('modalidade')?.invalid && form.get('modalidade')?.touched) {
            <span class="field-error">Informe a modalidade.</span>
          }
        </div>

        <div class="col-6 field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Limite aprovado *</mat-label>
            <input matInput type="number" formControlName="limite" />
          </mat-form-field>
          @if (form.get('limite')?.invalid && form.get('limite')?.touched) {
            <span class="field-error">Informe o limite.</span>
          }
        </div>

        <div class="col-6 field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              @for (status of statusOptions; track status) {
                <mat-option [value]="status">{{ status }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <div class="col-6 field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Inicio</mat-label>
            <input matInput [matDatepicker]="inicioPicker" formControlName="inicio" />
            <mat-datepicker #inicioPicker></mat-datepicker>
          </mat-form-field>
        </div>

        <div class="col-6 field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Vencimento</mat-label>
            <input matInput [matDatepicker]="vencimentoPicker" formControlName="vencimento" />
            <mat-datepicker #vencimentoPicker></mat-datepicker>
          </mat-form-field>
        </div>

        <div class="col-12 field">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Observacoes</mat-label>
            <textarea matInput rows="2" formControlName="observacoes"></textarea>
          </mat-form-field>
        </div>
      </form>

      <lib-action-bar>
        <div action-bar-summary class="drawer-summary">
          Mock para demonstrar formulario do GDE aberto pelo Conta Corrente.
        </div>
        <div action-bar-actions>
          <button mat-stroked-button color="primary" type="button" (click)="cancel()">
            Cancelar
          </button>
          <button
            mat-raised-button
            color="primary"
            type="button"
            [disabled]="form.invalid"
            (click)="save()"
          >
            Salvar
          </button>
        </div>
      </lib-action-bar>
    </section>
  `,
  styles: [
    `
      .contract-drawer {
        display: grid;
        gap: var(--mfe-space-4, 16px);
      }

      :host-context(.aurora-dark) .contract-drawer {
        --mfe-surface: var(--color-surface-background-medium, #16202b);
        --mfe-border: var(--color-surface-stroke-medium, #364b5d);
        --mfe-card-shadow: 0 10px 18px rgba(0, 0, 0, 0.35);
      }

      .contract-header h3 {
        margin: 0;
        font-size: var(--font-size-lg, 18px);
        color: var(--mfe-text, #1d2b36);
      }

      .contract-header .subtitle {
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

      :host-context(.aurora-dark) .drawer-note {
        border-color: var(--color-surface-stroke-medium, #364b5d);
        background: var(--color-surface-background-medium, #16202b);
        color: var(--color-surface-text-default-medium, #c2d0dc);
      }

      .contract-form {
        display: grid;
        grid-template-columns: repeat(12, minmax(0, 1fr));
        gap: var(--mfe-space-3, 12px);
        align-items: end;
      }

      :host-context(.aurora-dark) .contract-drawer .mat-mdc-form-field {
        --mdc-outlined-text-field-container-color: var(--color-surface-background-medium, #16202b);
        --mdc-outlined-text-field-outline-color: var(--color-surface-stroke-medium, #364b5d);
        --mdc-outlined-text-field-hover-outline-color: color-mix(
          in srgb,
          var(--color-surface-stroke-medium, #364b5d) 70%,
          #ffffff
        );
        --mdc-outlined-text-field-focus-outline-color: var(--color-brand-main, #8ab4ff);
        --mdc-outlined-text-field-label-text-color: var(--color-surface-text-default-medium, #c2d0dc);
        --mdc-outlined-text-field-input-text-color: var(--color-surface-text-default-high, #f0f5fb);
        --mdc-outlined-text-field-placeholder-color: color-mix(
          in srgb,
          var(--color-surface-text-default-medium, #c2d0dc) 80%,
          transparent
        );
        --mdc-outlined-text-field-caret-color: var(--color-brand-main, #8ab4ff);
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

      .drawer-summary {
        font-weight: 600;
      }
    `
  ]
})
export class ContractDrawerFormComponent implements OnInit {
  private readonly drawerRef = inject(DrawerRef<ContractDrawerResult>, { optional: true });
  private readonly fb = inject(NonNullableFormBuilder);
  readonly data = inject(DRAWER_DATA, { optional: true }) as ContractDrawerData | null;

  readonly modalidades = ['Capital de giro', 'Investimento', 'Rural', 'Consignado'];
  readonly statusOptions = ['Ativo', 'Suspenso', 'Encerrado'];

  readonly form = this.fb.group({
    contratoId: ['', Validators.required],
    cooperado: ['', Validators.required],
    conta: ['', Validators.required],
    cooperativa: [''],
    agencia: [''],
    modalidade: ['Capital de giro', Validators.required],
    limite: [120000, Validators.required],
    status: ['Ativo'],
    inicio: [new Date()],
    vencimento: [new Date(new Date().getFullYear() + 1, 11, 31)],
    observacoes: ['Contrato carregado via remote GDE.']
  });

  ngOnInit(): void {
    if (!this.data) {
      return;
    }

    this.form.patchValue({
      contratoId: this.data.contratoId ?? '',
      cooperado: this.data.cooperado ?? '',
      conta: this.data.conta ?? '',
      cooperativa: this.data.cooperativa ?? '',
      agencia: this.data.agencia ?? ''
    });
  }

  cancel(): void {
    this.drawerRef?.close({ action: 'cancel' });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const values = this.form.getRawValue();
    const payload: ContractFormPayload = {
      contratoId: values.contratoId,
      cooperado: values.cooperado,
      conta: values.conta,
      cooperativa: values.cooperativa,
      agencia: values.agencia,
      modalidade: values.modalidade,
      limite: values.limite,
      status: values.status,
      inicioISO: values.inicio ? values.inicio.toISOString() : null,
      vencimentoISO: values.vencimento ? values.vencimento.toISOString() : null,
      observacoes: values.observacoes
    };

    this.drawerRef?.close({
      action: 'saved',
      payload
    });
  }
}
