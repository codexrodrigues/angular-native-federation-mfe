import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-action-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      class="action-bar"
      [class.action-bar--sticky]="sticky"
      role="region"
      aria-label="Acoes da pagina"
    >
      <div class="action-bar__summary">
        <ng-content select="[action-bar-summary]"></ng-content>
      </div>
      <div class="action-bar__actions">
        <ng-content select="[action-bar-actions]"></ng-content>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .action-bar {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mfe-space-3, 12px);
        align-items: center;
        justify-content: space-between;
        padding: var(--mfe-space-3, 12px) var(--mfe-space-4, 16px);
        border-radius: var(--mfe-radius-lg, 16px);
        border: 1px solid var(--mfe-border, #e5e9ef);
        background: var(--mfe-surface, #ffffff);
        box-shadow: var(--mfe-card-shadow, 0px 2px 6px rgba(0, 30, 36, 0.08));
        margin-top: var(--mfe-space-4, 16px);
      }

      .action-bar--sticky {
        position: sticky;
        bottom: var(--mfe-space-4, 16px);
        z-index: 5;
      }

      .action-bar__summary {
        font-size: var(--font-size-sm, 14px);
        color: var(--mfe-text-muted, #51606a);
        display: flex;
        flex-wrap: wrap;
        gap: var(--mfe-space-2, 8px);
        align-items: center;
      }

      .action-bar__actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mfe-space-2, 8px);
        align-items: center;
      }
    `
  ]
})
export class ActionBarComponent {
  @Input() sticky = true;
}
