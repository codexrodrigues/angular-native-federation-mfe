import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type PageBreadcrumb = {
  label: string;
  url?: string;
};

export type PageHeaderAction = {
  id: string;
  label: string;
  tone?: 'primary' | 'neutral';
  fillMode?: 'solid' | 'outline' | 'ghost';
  disabled?: boolean;
};

@Component({
  selector: 'lib-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="page-header">
      @if (breadcrumbs?.length) {
        <nav class="page-header__breadcrumbs" aria-label="Breadcrumb">
          <ol>
            @for (crumb of breadcrumbs; track crumb.label; let isLast = $last) {
              <li>
                @if (crumb.url && !isLast) {
                  <a [attr.href]="crumb.url">{{ crumb.label }}</a>
                } @else {
                  <span>{{ crumb.label }}</span>
                }
              </li>
            }
          </ol>
        </nav>
      }

      <div class="page-header__main">
        <div class="page-header__titles">
          <h1 class="page-header__title">{{ title }}</h1>
          @if (subtitle) {
            <p class="page-header__subtitle">{{ subtitle }}</p>
          }
        </div>

        <div class="page-header__actions">
          <ng-content select="[page-actions]"></ng-content>
          @if (actions?.length) {
            @for (action of actions; track action.id) {
              <button
                type="button"
                class="{{ actionClass(action) }}"
                [disabled]="action.disabled"
                (click)="actionClick.emit(action.id)"
              >
                {{ action.label }}
              </button>
            }
          }
        </div>
      </div>
    </header>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .page-header {
        display: grid;
        gap: var(--mfe-space-3, 12px);
        margin-bottom: var(--mfe-space-4, 16px);
      }

      .page-header__breadcrumbs ol {
        margin: 0;
        padding: 0;
        list-style: none;
        display: flex;
        flex-wrap: wrap;
        gap: var(--mfe-space-2, 8px);
        color: var(--mfe-text-muted, #51606a);
        font-size: var(--font-size-xs, 12px);
      }

      .page-header__breadcrumbs li {
        display: inline-flex;
        align-items: center;
        gap: var(--mfe-space-2, 8px);
      }

      .page-header__breadcrumbs li:not(:last-child)::after {
        content: '/';
        color: var(--mfe-text-muted, #51606a);
      }

      .page-header__breadcrumbs a {
        color: inherit;
        text-decoration: none;
      }

      .page-header__main {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mfe-space-4, 16px);
        align-items: flex-end;
        justify-content: space-between;
      }

      .page-header__title {
        margin: 0;
        font-size: clamp(22px, 2.4vw, 30px);
        color: var(--mfe-text, #1d2b36);
      }

      .page-header__subtitle {
        margin: var(--mfe-space-1, 4px) 0 0;
        color: var(--mfe-text-muted, #51606a);
        font-size: var(--font-size-sm, 14px);
        max-width: 680px;
      }

      .page-header__actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mfe-space-2, 8px);
        align-items: center;
      }

      .page-header__action {
        border-radius: var(--mfe-radius-md, 12px);
        padding: 8px 14px;
        font-size: var(--font-size-sm, 14px);
        font-weight: var(--font-weight-semi-bold, 600);
        border: 1px solid transparent;
        cursor: pointer;
        background: var(--mfe-surface, #ffffff);
        color: var(--mfe-text, #1d2b36);
        transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
      }

      .page-header__action--primary.page-header__action--solid {
        background: var(--mfe-primary, #2f6fed);
        color: var(--color-surface-text-highlight-low, #ffffff);
        border-color: var(--mfe-primary, #2f6fed);
      }

      .page-header__action--primary.page-header__action--outline {
        background: transparent;
        color: var(--mfe-primary, #2f6fed);
        border-color: color-mix(in srgb, var(--mfe-primary, #2f6fed) 55%, #ffffff);
      }

      .page-header__action--neutral.page-header__action--outline {
        background: transparent;
        color: var(--mfe-text, #1d2b36);
        border-color: var(--mfe-border, #e5e9ef);
      }

      .page-header__action--ghost {
        background: transparent;
        color: var(--mfe-primary, #2f6fed);
        border-color: transparent;
      }

      .page-header__action:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      @media (max-width: 720px) {
        .page-header__main {
          align-items: flex-start;
        }
      }
    `
  ]
})
export class PageHeaderComponent {
  @Input({ required: true }) title = '';
  @Input() subtitle?: string;
  @Input() breadcrumbs: PageBreadcrumb[] = [];
  @Input() actions: PageHeaderAction[] = [];

  @Output() actionClick = new EventEmitter<string>();

  actionClass(action: PageHeaderAction): string {
    const tone = action.tone ?? 'primary';
    const fillMode = action.fillMode ?? 'solid';
    return `page-header__action page-header__action--${tone} page-header__action--${fillMode}`;
  }
}
