import { Component } from '@angular/core';
import { Routes } from '@angular/router';

@Component({
  selector: 'app-gde-shell-fallback',
  standalone: true,
  template: `
    <section class="gde-fallback">
      <h2>GDE - Gestao de Empresas</h2>
      <p>
        O micro front-end de GDE sera carregado no navegador. Se esta pagina
        permanecer visivel, verifique se o remote esta ativo.
      </p>
    </section>
  `,
  styles: [
    `
      .gde-fallback {
        max-width: 640px;
        padding: 1.6rem;
        border-radius: 18px;
        border: 1px solid color-mix(in srgb, var(--color-primary, #2f6fed) 18%, #d7dde3);
        background: rgba(255, 255, 255, 0.85);
        box-shadow: 0 20px 40px rgba(10, 18, 30, 0.12);
      }

      .gde-fallback h2 {
        margin: 0 0 0.5rem;
        font-size: 1.5rem;
      }

      .gde-fallback p {
        margin: 0;
        color: color-mix(in srgb, var(--text, #1d2b36) 75%, transparent);
        line-height: 1.5;
      }
    `
  ]
})
export class GdeShellFallbackComponent {}

export const GDE_SHELL_ROUTES: Routes = [
  {
    path: '',
    component: GdeShellFallbackComponent
  }
];
