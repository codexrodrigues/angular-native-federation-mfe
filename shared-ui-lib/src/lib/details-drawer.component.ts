import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type DrawerMetaItem = {
  label: string;
  value: string;
};

export type DrawerCallout = {
  title: string;
  message: string;
  actionLabel?: string;
};

@Component({
  selector: 'lib-details-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="details-drawer">
      <ng-content></ng-content>

      <div
        class="details-drawer__overlay"
        [class.is-open]="open"
        (click)="close.emit()"
        aria-hidden="true"
      ></div>

      <aside
        class="details-drawer__panel"
        [class.is-open]="open"
        [class.details-drawer__panel--sm]="size === 'sm'"
        [class.details-drawer__panel--md]="size === 'md'"
        [class.details-drawer__panel--lg]="size === 'lg'"
        [class.details-drawer__panel--xl]="size === 'xl'"
        [class.details-drawer__panel--full]="size === 'full'"
        [ngClass]="panelClass"
        [style.width.px]="size ? null : width"
        role="dialog"
        aria-modal="true"
        [attr.aria-hidden]="!open"
        [attr.aria-label]="ariaLabel || title || 'Detalhes'"
        tabindex="-1"
      >
        <header class="details-drawer__header">
          <div class="details-drawer__titlebar">
            <div>
              <p class="details-drawer__kicker">Detalhes</p>
              <h2 class="details-drawer__title">{{ title }}</h2>
              @if (subtitle) {
                <p class="details-drawer__subtitle">{{ subtitle }}</p>
              }
            </div>
            <button
              type="button"
              class="details-drawer__close"
              (click)="close.emit()"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
        </header>

        <div class="details-drawer__body">
          <div class="details-drawer__meta">
            @for (item of meta; track item.label) {
              <div class="details-drawer__meta-item">
                <span class="details-drawer__meta-label">{{ item.label }}</span>
                <span class="details-drawer__meta-value">{{ item.value }}</span>
              </div>
            }
          </div>

          @if (callout) {
            <section class="details-drawer__callout">
              <div>
                <strong>{{ callout.title }}</strong>
                <p>{{ callout.message }}</p>
              </div>
              @if (callout.actionLabel) {
                <button type="button" class="details-drawer__cta" (click)="calloutAction.emit()">
                  {{ callout.actionLabel }}
                </button>
              }
            </section>
          }

          <section class="details-drawer__section">
            @if (sectionTitle) {
              <h3 class="details-drawer__section-title">{{ sectionTitle }}</h3>
            }
            <ng-content select="[drawer-body]"></ng-content>
          </section>
        </div>

        <footer class="details-drawer__footer"><ng-content select="[drawer-actions]"></ng-content></footer>
      </aside>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .details-drawer {
        position: relative;
      }

      .details-drawer__overlay {
        position: fixed;
        inset: 0;
        background: var(--mfe-drawer-overlay, rgba(0, 30, 36, 0.35));
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
        z-index: 50;
      }

      .details-drawer__overlay.is-open {
        opacity: 1;
        pointer-events: auto;
      }

      .details-drawer__panel {
        position: fixed;
        top: 0;
        right: 0;
        height: 100vh;
        background: var(--mfe-drawer-bg, var(--mfe-surface, #ffffff));
        border-left: 1px solid var(--mfe-drawer-border, var(--mfe-border, #e5e9ef));
        box-shadow: var(--mfe-drawer-shadow, var(--mfe-overlay-shadow, 0px 12px 24px rgba(0, 30, 36, 0.24)));
        transform: translateX(100%);
        transition: transform var(--mfe-drawer-transition, 0.2s ease);
        z-index: 60;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .details-drawer__panel.is-open {
        transform: translateX(0);
      }

      .details-drawer__panel--sm {
        width: var(--mfe-drawer-width-sm, 360px);
      }

      .details-drawer__panel--md {
        width: var(--mfe-drawer-width-md, 480px);
      }

      .details-drawer__panel--lg {
        width: var(--mfe-drawer-width-lg, 640px);
      }

      .details-drawer__panel--xl {
        width: var(--mfe-drawer-width-xl, 820px);
      }

      .details-drawer__panel--full {
        width: var(--mfe-drawer-width-full, 100vw);
        max-width: 100vw;
        border-radius: 0;
      }

      .details-drawer__header {
        padding: var(--mfe-space-4, 16px) var(--mfe-space-5, 24px);
        background: var(--mfe-surface-muted, #f6f7f9);
        border-bottom: 1px solid var(--mfe-drawer-border, var(--mfe-border, #e5e9ef));
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
      }

      .details-drawer__titlebar {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: var(--mfe-space-3, 12px);
      }

      .details-drawer__kicker {
        margin: 0 0 var(--mfe-space-1, 4px);
        font-size: var(--font-size-xs, 12px);
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--mfe-text-muted, #51606a);
      }

      .details-drawer__title {
        margin: 0;
        font-size: var(--font-size-lg, 18px);
        color: var(--mfe-text, #1d2b36);
      }

      .details-drawer__subtitle {
        margin: var(--mfe-space-1, 4px) 0 0;
        color: var(--mfe-text-muted, #51606a);
        font-size: var(--font-size-sm, 14px);
      }

      .details-drawer__close {
        border: 0;
        background: transparent;
        width: 28px;
        height: 28px;
        cursor: pointer;
        color: var(--mfe-text-muted, #51606a);
        font-size: 18px;
        line-height: 1;
      }

      .details-drawer__close:hover {
        color: var(--mfe-text, #1d2b36);
      }

      .details-drawer__close:focus-visible {
        outline: 2px solid color-mix(in srgb, var(--mfe-primary, #2f6fed) 50%, transparent);
        outline-offset: 2px;
        border-radius: 6px;
      }

      .details-drawer__body {
        flex: 1;
        overflow-y: auto;
        display: grid;
        gap: var(--mfe-space-3, 12px);
        padding: var(--mfe-space-4, 16px) var(--mfe-space-5, 24px) 0;
      }

      .details-drawer__meta {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: var(--mfe-space-3, 12px);
      }

      .details-drawer__meta-item {
        display: grid;
        gap: var(--mfe-space-1, 4px);
      }

      .details-drawer__meta-label {
        font-size: var(--font-size-xs, 12px);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--mfe-text-muted, #51606a);
      }

      .details-drawer__meta-value {
        font-weight: 600;
        color: var(--mfe-text, #1d2b36);
        font-size: var(--font-size-sm, 14px);
      }

      .details-drawer__callout {
        border-radius: var(--mfe-radius-md, 12px);
        padding: var(--mfe-space-3, 12px);
        background: color-mix(in srgb, var(--mfe-primary, #2f6fed) 12%, #ffffff);
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: var(--mfe-space-3, 12px);
      }

      .details-drawer__callout p {
        margin: var(--mfe-space-1, 4px) 0 0;
        color: var(--mfe-text-muted, #51606a);
        font-size: var(--font-size-sm, 14px);
      }

      .details-drawer__cta {
        border: 1px solid var(--mfe-primary, #2f6fed);
        background: transparent;
        color: var(--mfe-primary, #2f6fed);
        padding: 6px 12px;
        border-radius: 999px;
        font-weight: 600;
        cursor: pointer;
      }

      .details-drawer__section {
        display: grid;
        gap: var(--mfe-space-2, 8px);
        min-height: 0;
        padding-bottom: var(--mfe-space-5, 24px);
      }

      .details-drawer__section-title {
        margin: 0;
        font-size: var(--font-size-sm, 14px);
        color: var(--mfe-text, #1d2b36);
      }

      .details-drawer__section .action-bar {
        margin-top: var(--mfe-space-3, 12px);
        bottom: 0;
        position: sticky;
        z-index: 2;
      }

      .details-drawer__footer {
        padding: var(--mfe-space-3, 12px) var(--mfe-space-5, 24px) var(--mfe-space-4, 16px);
        border-top: 1px solid var(--mfe-drawer-border, var(--mfe-border, #e5e9ef));
        background: var(--mfe-surface-muted, #f6f7f9);
      }

      .details-drawer__footer:empty {
        display: none;
      }

      :host-context(.aurora-dark) .details-drawer__header,
      :host-context(.aurora-dark) .details-drawer__footer {
        background: var(--color-surface-background-medium, #16202b);
      }

      :host-context(.aurora-dark) .details-drawer__close:hover {
        color: var(--color-surface-text-default-high, #f0f5fb);
      }

      :host-context(.aurora-dark) .details-drawer__section .action-bar {
        box-shadow: 0 -8px 16px rgba(0, 0, 0, 0.35);
      }

      @media (max-width: 720px) {
        .details-drawer__callout {
          flex-direction: column;
          align-items: flex-start;
        }

        .details-drawer__cta {
          align-self: flex-start;
        }
      }
    `
  ]
})
export class DetailsDrawerComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() width = 420;
  @Input() size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  @Input() meta: DrawerMetaItem[] = [];
  @Input() callout?: DrawerCallout;
  @Input() sectionTitle?: string;
  @Input() panelClass?: string | string[];
  @Input() ariaLabel?: string;

  @Output() close = new EventEmitter<void>();
  @Output() calloutAction = new EventEmitter<void>();
}
