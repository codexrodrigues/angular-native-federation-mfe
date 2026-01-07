import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { PayablesService } from '../services/payables.service';

type SupplierIndicatorStatus = 'success' | 'warning' | 'info' | 'error' | 'neutral';

type SupplierIndicator = {
  label: string;
  status: SupplierIndicatorStatus;
  detail: string;
};

@Component({
  selector: 'app-legacy-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatSelectModule
  ],
  template: `
    <div class="legacy-form-container">
      <div class="form-header ds-grid">
        <div class="col-3">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>ID Título a Pagar</mat-label>
            <input matInput [value]="'1317035'" readonly />
          </mat-form-field>
        </div>

        <div class="col-3">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Situação</mat-label>
            <mat-select [value]="'EM ELABORAÇÃO'" disabled>
              @for (status of ['EM ELABORAÇÃO', 'ABERTO', 'PAGO']; track status) {
                <mat-option [value]="status">{{ status }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <div class="col-6 values-card">
          <div class="value-row">
            <div class="value-item">
              <span class="label">Valor Adiantamento:</span>
              <span class="value">0,00</span>
            </div>
            <div class="value-item">
              <span class="label">Valor Retenção:</span>
              <span class="value">0,00</span>
            </div>
          </div>
          <div class="value-row">
            <div class="value-item">
              <span class="label">Valor Acréscimo:</span>
              <span class="value">0,00</span>
            </div>
            <div class="value-item">
              <span class="label">Valor Desconto:</span>
              <span class="value">0,00</span>
            </div>
          </div>
          <div class="value-row highlight">
            <div class="value-item large">
              <span class="label">Valor Líquido a Pagar:</span>
              <span class="value">2.073,75</span>
            </div>
          </div>
        </div>

        <div class="col-6">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Instituição Resp</mat-label>
            <input matInput [value]="'2003 - COOPERATIVA GAMA'" readonly />
          </mat-form-field>
        </div>

        <div class="col-4">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Instituição</mat-label>
            <input matInput [value]="'4264 - COOPERATIVA DELTA'" readonly />
          </mat-form-field>
        </div>

        <div class="col-2">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Tipo Imóvel</mat-label>
            <input matInput [value]="'Próprio'" readonly />
          </mat-form-field>
        </div>

        <div class="col-12">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>PA</mat-label>
            <input matInput [value]="'88 - UAD - UNIDADE ADMINISTRATIVA - 00.000.000/0000-00'" readonly />
          </mat-form-field>
        </div>

        <div class="col-8">
          <div class="input-group">
            <mat-form-field appearance="outline" class="w-150">
              <mat-label>Fornecedor</mat-label>
              <input matInput [value]="'00000000000000'" readonly />
            </mat-form-field>
            <button mat-icon-button color="primary" aria-label="Buscar fornecedor">
              <mat-icon>search</mat-icon>
            </button>
            <mat-form-field appearance="outline" class="flex-1">
              <mat-label>Nome</mat-label>
              <input matInput [value]="'FORNECEDOR EXEMPLO LTDA'" readonly />
            </mat-form-field>
          </div>
        </div>

        <div class="col-4 provider-actions">
          <div class="provider-meta">
            <span>Tributação: <strong>Lucro Real</strong></span>
            <span>Consulta: 11/11/2025</span>
          </div>
        </div>
      </div>

      <section class="legacy-tabs">
        <div class="tab-content-wrapper">
            <div class="status-bar">
              <div class="status-left">
                <span class="section-title">SITUAÇÃO DO FORNECEDOR</span>
              </div>

              <div class="indicators-list">
                @for (indicator of supplierIndicators; track indicator.label) {
                  <div class="indicator-item">
                    <mat-icon class="status-dot" [ngClass]="indicatorDotClass(indicator.status)">
                      fiber_manual_record
                    </mat-icon>
                    <span class="indicator-label">{{ indicator.label }}</span>
                    <span class="mfe-badge mfe-badge--caps" [ngClass]="indicatorBadgeClass(indicator.status)">
                      {{ indicator.detail }}
                    </span>
                  </div>
                }
              </div>
            </div>

            <div class="section-header">Dados do Registro</div>

            <form [formGroup]="form" class="nested-form ds-grid">
                  <div class="col-6">
                    <div class="input-group">
                      <mat-form-field appearance="outline" class="w-80">
                        <mat-label>Código</mat-label>
                        <input matInput formControlName="naturezaCode" />
                      </mat-form-field>
                      <button mat-icon-button color="primary" aria-label="Buscar natureza">
                        <mat-icon>search</mat-icon>
                      </button>
                      <mat-form-field appearance="outline" class="flex-1">
                        <mat-label>Natureza Operação *</mat-label>
                        <input matInput [value]="'OUTROS'" readonly />
                      </mat-form-field>
                    </div>
                  </div>

                  <div class="col-6">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Situação Documento *</mat-label>
                      <mat-select formControlName="situacaoDocumento">
                        @for (option of ['DOCUMENTO REGULAR', 'DOCUMENTO CANCELADO']; track option) {
                          <mat-option [value]="option">{{ option }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <div class="col-6">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Grupo Documento *</mat-label>
                      <mat-select formControlName="grupoDocumento">
                        @for (option of ['OUTROS DOCUMENTOS', 'FISCAL']; track option) {
                          <mat-option [value]="option">{{ option }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <div class="col-6">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Tipo Documento *</mat-label>
                      <mat-select formControlName="tipoDocumento">
                        @for (option of ['OUTROS DOCUMENTOS', 'BOLETO']; track option) {
                          <mat-option [value]="option">{{ option }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <div class="col-6">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Valor Documento *</mat-label>
                      <input matInput type="number" formControlName="valorDocumento" />
                    </mat-form-field>
                  </div>

                  <div class="col-6">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Número Documento *</mat-label>
                      <input matInput formControlName="numeroDocumento" />
                    </mat-form-field>
                  </div>

                  <div class="col-6">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Data Documento *</mat-label>
                      <input matInput [matDatepicker]="dataDoc" formControlName="dataDocumento" />
                      <mat-datepicker #dataDoc></mat-datepicker>
                    </mat-form-field>
                  </div>

                  <div class="col-6">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Data Entrada *</mat-label>
                      <input matInput [matDatepicker]="dataEntrada" formControlName="dataEntrada" />
                      <mat-datepicker #dataEntrada></mat-datepicker>
                    </mat-form-field>
                  </div>

                  <div class="col-12">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Descrição / Complemento Histórico *</mat-label>
                      <textarea matInput rows="3" formControlName="historico"></textarea>
                    </mat-form-field>
                  </div>

                  <div class="col-12 checkbox-row">
                    <mat-checkbox formControlName="gerarProvisao">Gerar Provisão Contábil</mat-checkbox>
                  </div>

                  @if (form.get('gerarProvisao')?.value) {
                    <div class="col-6">
                      <div class="input-group">
                        <mat-form-field appearance="outline" class="flex-1">
                          <mat-label>Número Contrato</mat-label>
                          <input matInput formControlName="numeroContrato" />
                        </mat-form-field>
                        <button mat-icon-button color="primary" aria-label="Buscar contrato">
                          <mat-icon>search</mat-icon>
                        </button>
                      </div>
                    </div>
                  }
            </form>
        </div>
      </section>

      <div class="form-footer">
        <div class="footer-right">
          <button mat-button color="primary" (click)="goBack()">VOLTAR</button>
          <button mat-stroked-button color="primary" (click)="goBack()">CANCELAR</button>
          <button mat-raised-button color="primary" (click)="save()">OK</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .ds-grid {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        gap: var(--mfe-space-5, 24px);
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

      .legacy-form-container {
        display: flex;
        flex-direction: column;
        gap: var(--mfe-space-4, 16px);
        padding: var(--mfe-space-5, 24px);
        background-color: var(--mfe-surface-muted, #f6f7f9);
        height: 100%;
        box-sizing: border-box;
      }

      .form-header {
        background: var(--mfe-surface, #ffffff);
        padding: var(--mfe-space-5, 24px);
        border-radius: var(--mfe-radius-lg, 16px);
        border: 1px solid var(--mfe-border, #e5e9ef);
        box-shadow: var(--mfe-card-shadow, 0px 2px 6px rgba(0, 30, 36, 0.08));
      }

      .legacy-tabs {
        background: var(--mfe-surface, #ffffff);
        border-radius: var(--mfe-radius-lg, 16px);
        border: 1px solid var(--mfe-border, #e5e9ef);
        overflow: hidden;
      }

      .tab-content-wrapper {
        display: grid;
        gap: var(--mfe-space-4, 16px);
        padding: var(--mfe-space-4, 16px);
      }

      .nested-form {
        padding: var(--mfe-space-4, 16px);
        background: var(--mfe-surface, #ffffff);
        border: 1px solid var(--mfe-border, #e5e9ef);
        border-radius: var(--mfe-radius-lg, 16px);
      }

      .input-group {
        display: flex;
        gap: 8px;
        width: 100%;
        align-items: flex-end;
      }

      .full-width {
        width: 100%;
      }

      .flex-1 { flex: 1; }
      .w-80 { width: 80px; flex: none; }
      .w-150 { width: 150px; flex: none; }

      .values-card {
        background: var(--mfe-surface-muted, #f6f7f9);
        padding: var(--mfe-space-4, 16px);
        border-radius: var(--mfe-radius-md, 12px);
        border: 1px solid var(--mfe-border, #e5e9ef);
        display: flex;
        flex-direction: column;
        gap: var(--mfe-space-2, 8px);
      }

      .value-row {
        display: flex;
        justify-content: space-between;
        gap: var(--mfe-space-4, 16px);
      }

      .value-item {
        display: flex;
        gap: 8px;
        font-size: 12px;
        color: var(--color-surface-text-default-high, #333);
      }

      .value-item .label { color: var(--color-surface-text-default-medium, #666); }
      .value-item .value { font-weight: 600; }

      .value-row.highlight {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--color-surface-stroke-medium, #ccc);
      }

      .value-item.large .label,
      .value-item.large .value {
        font-size: 14px;
        color: var(--color-function-primary-default, #2f6fed);
      }

      .provider-actions {
        display: flex;
        flex-direction: column;
        gap: var(--mfe-space-2, 8px);
        align-items: flex-start;
        justify-content: flex-start;
      }

      .action-buttons {
        display: flex;
        gap: var(--mfe-space-2, 8px);
        align-items: center;
        flex-wrap: wrap;
      }

      .provider-meta {
        font-size: 12px;
        color: var(--color-surface-text-default-medium, #666);
        display: flex;
        gap: var(--mfe-space-4, 16px);
      }

      .status-bar {
        display: flex;
        align-items: center;
        gap: var(--mfe-space-4, 16px);
        padding: var(--mfe-space-3, 12px) var(--mfe-space-4, 16px);
        background: var(--mfe-surface-muted, #f6f7f9);
        border: 1px dashed var(--mfe-border-strong, #d5dae2);
        border-radius: var(--mfe-radius-md, 12px);
      }

      .status-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .section-title {
        font-weight: 700;
        font-size: 12px;
        color: var(--color-surface-text-default-medium, #666);
        letter-spacing: 0.5px;
      }

      .indicators-list {
        display: flex;
        gap: var(--mfe-space-5, 24px);
        margin-left: var(--mfe-space-5, 24px);
      }

      .indicator-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 500;
      }

      .indicator-label {
        font-weight: 600;
        color: var(--mfe-text, #1d2b36);
      }

      .status-dot {
        font-size: 14px;
      }

      .status-dot--success {
        color: var(--color-denotative-success-default, #7db61c);
      }

      .status-dot--warning {
        color: var(--color-denotative-warning-default, #ffaa2c);
      }

      .status-dot--info {
        color: var(--color-denotative-info-default, #0090e0);
      }

      .status-dot--error {
        color: var(--color-denotative-error-default, #f7406c);
      }

      .status-dot--neutral {
        color: var(--mfe-text-muted, #51606a);
      }

      .checkbox-row {
        display: flex;
        align-items: center;
        gap: var(--mfe-space-2, 8px);
        padding-top: var(--mfe-space-2, 8px);
      }

      .section-header {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--mfe-text-muted, #51606a);
      }

      .form-footer {
        display: flex;
        justify-content: flex-end;
        padding: var(--mfe-space-4, 16px) var(--mfe-space-5, 24px);
        background: var(--mfe-surface, #ffffff);
        border: 1px solid var(--mfe-border, #e5e9ef);
        border-radius: var(--mfe-radius-lg, 16px);
        box-shadow: var(--mfe-card-shadow, 0px 2px 6px rgba(0, 30, 36, 0.08));
      }

      .footer-right {
        display: flex;
        gap: var(--mfe-space-2, 8px);
      }

      @media (max-width: 960px) {
        .legacy-form-container {
          padding: var(--mfe-space-4, 16px);
        }

        .form-header,
        .tab-content-wrapper,
        .form-footer {
          padding: var(--mfe-space-4, 16px);
        }

        .provider-meta {
          flex-direction: column;
          gap: var(--mfe-space-1, 4px);
        }

        .status-bar {
          flex-direction: column;
          align-items: flex-start;
        }

        .indicators-list {
          margin-left: 0;
          flex-wrap: wrap;
        }
      }
    `
  ]
})
export class LegacyFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private payablesService = inject(PayablesService);

  form: FormGroup;
  isEditMode = false;
  recordId: string | null = null;
  supplierIndicators: SupplierIndicator[] = [
    { label: 'Fiscal', status: 'success', detail: 'Regular' },
    { label: 'Cadastral', status: 'warning', detail: 'Pendente' },
    { label: 'Avaliação', status: 'success', detail: 'Aprovada' }
  ];

  constructor() {
    this.form = this.fb.group({
      naturezaCode: ['23'],
      situacaoDocumento: ['DOCUMENTO REGULAR'],
      grupoDocumento: ['OUTROS DOCUMENTOS'],
      tipoDocumento: ['OUTROS DOCUMENTOS'],
      valorDocumento: [2073.75],
      numeroDocumento: ['1592'],
      dataDocumento: [new Date(2025, 11, 6)],
      dataEntrada: [new Date(2025, 11, 17)],
      historico: ['FORNECEDOR EXEMPLO LTDA,NUM. DOC: 1592,ID: 13170357,PROJETOS,PROJETOS - TREINAMENTO - REF. SERVICOS DE VIAGEM NO PERIODO DE 01 A 05/12/2025'],
      gerarProvisao: [true],
      numeroContrato: ['']
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.recordId = id;
      this.isEditMode = id !== null && id !== 'new';

      if (this.isEditMode && id) {
        const payable = this.payablesService.getById(Number(id));

        if (payable) {
          this.form.patchValue({
            numeroDocumento: payable.documento,
            valorDocumento: parseFloat(payable.valor.replace(',', '.')),
            historico: `Editando conta a pagar - Fornecedor: ${payable.fornecedor}, Doc: ${payable.documento}`
          });
        } else {
          alert('Registro não encontrado!');
          this.goBack();
        }
      } else {
        this.form.reset({
          situacaoDocumento: 'DOCUMENTO REGULAR',
          grupoDocumento: 'OUTROS DOCUMENTOS',
          tipoDocumento: 'OUTROS DOCUMENTOS',
          gerarProvisao: false
        });
      }
    });
  }

  indicatorDotClass(status: SupplierIndicatorStatus): string {
    switch (status) {
      case 'success':
        return 'status-dot--success';
      case 'warning':
        return 'status-dot--warning';
      case 'error':
        return 'status-dot--error';
      case 'info':
        return 'status-dot--info';
      default:
        return 'status-dot--neutral';
    }
  }

  indicatorBadgeClass(status: SupplierIndicatorStatus): string {
    switch (status) {
      case 'success':
        return 'mfe-badge--success';
      case 'warning':
        return 'mfe-badge--warning';
      case 'error':
        return 'mfe-badge--danger';
      case 'info':
        return 'mfe-badge--info';
      default:
        return 'mfe-badge--neutral';
    }
  }

  save() {
    if (this.form.invalid) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const formData = this.form.value;
    if (this.isEditMode && this.recordId) {
      const success = this.payablesService.update(Number(this.recordId), {
        documento: formData.numeroDocumento,
        valor: formData.valorDocumento.toFixed(2).replace('.', ','),
        situacao: formData.situacaoDocumento
      });
      if (success) {
        alert('Dados atualizados com sucesso!');
        this.goBack();
      }
    } else {
      this.payablesService.create({
        documento: formData.numeroDocumento,
        valor: formData.valorDocumento.toFixed(2).replace('.', ','),
        situacao: formData.situacaoDocumento,
        fornecedor: 'Novo fornecedor',
        vencimento: formData.dataDocumento?.toLocaleDateString('pt-BR') || new Date().toLocaleDateString('pt-BR')
      });
      alert('Novo registro criado com sucesso!');
      this.goBack();
    }
  }

  goBack() {
    this.router.navigate(['/gde/contas-a-pagar']);
  }
}
