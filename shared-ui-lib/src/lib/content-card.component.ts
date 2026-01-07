import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-content-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="content-card" [class.content-card--table]="variant === 'table'">
      @if (title || subtitle) {
        <header class="content-card__header">
          <div class="content-card__headline">
            @if (icon) {
              <span class="content-card__icon" aria-hidden="true">{{ icon }}</span>
            }
            <div>
              @if (title) {
                <h2 class="content-card__title">{{ title }}</h2>
              }
              @if (subtitle) {
                <p class="content-card__subtitle">{{ subtitle }}</p>
              }
            </div>
          </div>
          <div class="content-card__actions">
            <ng-content select="[card-actions]"></ng-content>
          </div>
        </header>
      }

      <div class="content-card__body">
        <ng-content></ng-content>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .content-card {
        background: var(--mfe-surface, #ffffff);
        border: 1px solid var(--mfe-border, #e5e9ef);
        border-radius: var(--mfe-radius-lg, 16px);
        padding: var(--mfe-space-4, 16px);
        box-shadow: var(--mfe-card-shadow, 0px 2px 6px rgba(0, 30, 36, 0.08));
        display: grid;
        gap: var(--mfe-space-4, 16px);
      }

      .content-card__header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--mfe-space-4, 16px);
        padding-bottom: var(--mfe-space-3, 12px);
        border-bottom: 1px solid var(--mfe-border, #e5e9ef);
      }

      .content-card__headline {
        display: flex;
        gap: var(--mfe-space-3, 12px);
        align-items: center;
      }

      .content-card__icon {
        width: 36px;
        height: 36px;
        border-radius: 12px;
        background: color-mix(in srgb, var(--mfe-primary, #2f6fed) 14%, #ffffff);
        color: var(--mfe-primary, #2f6fed);
        display: grid;
        place-items: center;
        font-weight: 700;
      }

      .content-card__title {
        margin: 0;
        font-size: var(--font-size-md, 16px);
        color: var(--mfe-text, #1d2b36);
      }

      .content-card__subtitle {
        margin: var(--mfe-space-1, 4px) 0 0;
        font-size: var(--font-size-sm, 14px);
        color: var(--mfe-text-muted, #51606a);
      }

      .content-card__actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mfe-space-2, 8px);
        align-items: center;
      }

      .content-card__body {
        display: grid;
        gap: var(--mfe-space-3, 12px);
      }

      .content-card--table .content-card__body {
        gap: var(--mfe-space-2, 8px);
      }
    `
  ]
})
export class ContentCardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() icon?: string;
  @Input() variant: 'default' | 'table' = 'default';
}
