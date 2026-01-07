import { Component } from '@angular/core';
import { Routes } from '@angular/router';

@Component({
  selector: 'app-accounts-shell-fallback',
  standalone: true,
  template: `
    <section class="accounts-fallback">
      <h2>Conta Corrente - Cooperados</h2>
      <p>
        O micro front-end de Conta Corrente sera carregado no navegador. Se esta pagina
        permanecer visivel, verifique se o remote esta ativo.
      </p>
    </section>
  `,
  styles: [
    `
      .accounts-fallback {
        max-width: 640px;
        padding: 1.6rem;
        border-radius: 18px;
        border: 1px solid color-mix(in srgb, var(--color-primary, #2f6fed) 18%, #d7dde3);
        background: rgba(255, 255, 255, 0.85);
        box-shadow: 0 20px 40px rgba(10, 18, 30, 0.12);
      }

      .accounts-fallback h2 {
        margin: 0 0 0.5rem;
        font-size: 1.5rem;
      }

      .accounts-fallback p {
        margin: 0;
        color: color-mix(in srgb, var(--text, #1d2b36) 75%, transparent);
        line-height: 1.5;
      }
    `
  ]
})
export class AccountsShellFallbackComponent {}

export const ACCOUNTS_SHELL_ROUTES: Routes = [
  {
    path: '',
    component: AccountsShellFallbackComponent
  }
];
