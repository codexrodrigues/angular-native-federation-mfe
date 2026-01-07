import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  template: `
    <section class="toast-stack" aria-live="polite" aria-label="Notificacoes">
      @for (toast of toasts(); track toast.id) {
        <article class="toast" [class]="'toast toast--' + toast.level" role="status">
          <div class="toast-body">
            @if (toast.title) {
              <strong class="toast-title">{{ toast.title }}</strong>
            }
            <span class="toast-message">{{ toast.message }}</span>
          </div>
          <button
            class="toast-dismiss"
            type="button"
            (click)="dismiss(toast.id)"
            aria-label="Fechar"
          >
            ×
          </button>
        </article>
      }
    </section>
  `,
  styles: [
    `
      :host {
        position: fixed;
        right: 1.4rem;
        bottom: 1.4rem;
        z-index: 320;
        pointer-events: none;
      }

      .toast-stack {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        align-items: flex-end;
      }

      .toast {
        --toast-accent: var(--shell-primary, #2f6fed);
        pointer-events: auto;
        min-width: 220px;
        max-width: min(360px, 90vw);
        padding: 0.65rem 0.75rem;
        border-radius: 12px;
        border: 1px solid var(--shell-sidebar-border, #e5e9ef);
        border-left: 4px solid var(--toast-accent);
        background: #ffffff;
        color: var(--shell-sidebar-text, #1d2b36);
        box-shadow: 0 8px 18px rgba(0, 24, 30, 0.15);
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
      }

      .toast--success {
        --toast-accent: #2fb344;
      }

      .toast--warning {
        --toast-accent: #f59f00;
      }

      .toast--error {
        --toast-accent: #f03e3e;
      }

      .toast-body {
        display: grid;
        gap: 0.25rem;
      }

      .toast-title {
        font-size: 0.82rem;
      }

      .toast-message {
        font-size: 0.75rem;
        line-height: 1.2rem;
        color: var(--shell-sidebar-muted, #51606a);
      }

      .toast-dismiss {
        border: none;
        background: transparent;
        color: inherit;
        font-size: 1rem;
        line-height: 1;
        padding: 0.1rem;
        cursor: pointer;
        margin-left: auto;
      }

      .toast-dismiss:focus-visible {
        outline: 2px solid var(--toast-accent);
        outline-offset: 2px;
        border-radius: 6px;
      }
    `
  ]
})
export class ToastHostComponent {
  private readonly toastService = inject(ToastService);
  readonly toasts = this.toastService.toasts;

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
