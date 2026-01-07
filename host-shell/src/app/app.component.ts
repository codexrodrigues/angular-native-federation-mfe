import { Component, computed, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  RouteConfigLoadEnd,
  RouteConfigLoadStart,
  Router
} from '@angular/router';
import { filter } from 'rxjs/operators';
import { AppShellComponent } from './app-shell.component';
import { MatIconModule } from '@angular/material/icon';
import { getRuntimeConfig, loadRuntimeConfig } from './runtime-config';
import { MenuGroup, MenuGroupDefaults, normalizeRemoteMenuPayload } from 'shared-logic/core';
import { TelemetryService } from './telemetry/telemetry.service';
import {
  CircuitBreakerOptions,
  RetryOptions,
  fetchWithTimeout,
  remoteFetchBreakers,
  withRetry
} from './resilience/remote-resilience';
import {
  WEB_COMPONENT_CONFIG,
  WebComponentConfig,
  getWebComponentByName,
  getWebComponentByRoute
} from './web-components/web-component-config';

type HomeFilter = {
  id: string;
  label: string;
};

type PlatformDefinition = {
  id: string;
  label: string;
  filterLabel: string;
  accent: string;
  icon: string;
  kind: 'federated' | 'web-component';
  route: string;
  summary: string;
};

type ModuleDefinition = {
  id: string;
  name: string;
  platformId: string;
  platformLabel: string;
  icon: string;
  rating?: number;
  route?: string;
  keywords?: string[];
};

type RemoteStatusState = 'loading' | 'ready' | 'missing' | 'error';

type RemoteInfoPayload = {
  name?: string;
  label?: string;
  angular?: string;
  libs?: Record<string, string>;
  stats?: Record<string, string | number>;
};

type RemoteStatusEntry = {
  name: string;
  label: string;
  accent: string;
  status: RemoteStatusState;
  url?: string;
  angular?: string;
  libs?: Record<string, string>;
  stats?: Record<string, string | number>;
  updatedAt?: string;
  error?: string;
};

type RemoteStatusView = {
  name: string;
  label: string;
  accent: string;
  status: RemoteStatusState;
  statusLabel: string;
  kind: 'federated' | 'web-component';
  url?: string;
  angular?: string;
  libs: Array<{ name: string; version: string }>;
  stats: Array<{ name: string; value: string }>;
  updatedAt?: string;
};

const HOME_PLATFORMS: PlatformDefinition[] = [
  {
    id: 'remote-sales',
    label: 'Vendas',
    filterLabel: 'Vendas',
    accent: '#2f9e44',
    icon: 'store',
    kind: 'federated',
    route: '/sales',
    summary: 'Canal de vendas e operações comerciais.'
  },
  {
    id: 'remote-gde',
    label: 'Gestão de Empresas',
    filterLabel: 'Gestão de Empresas',
    accent: '#1971c2',
    icon: 'business_center',
    kind: 'federated',
    route: '/gde',
    summary: 'Contas a pagar, cadastros e rotinas operacionais.'
  },
  {
    id: 'remote-accounts',
    label: 'Conta Corrente',
    filterLabel: 'Conta Corrente',
    accent: '#0b7285',
    icon: 'account_balance_wallet',
    kind: 'federated',
    route: '/conta-corrente',
    summary: 'Extratos, limites e operação diária.'
  },
  {
    id: 'remote-credito',
    label: 'Credito (v19)',
    filterLabel: 'Credito (v19)',
    accent: '#f08c00',
    icon: 'credit_card',
    kind: 'web-component',
    route: '/credito',
    summary: 'Simulação, concessão e ofertas de credito.'
  }
];

const HOME_FILTERS: HomeFilter[] = [
  { id: 'todos', label: 'Todos' },
  ...HOME_PLATFORMS.map((platform) => ({
    id: platform.id,
    label: platform.filterLabel
  }))
];

const HOME_PLATFORM_INDEX = HOME_PLATFORMS.reduce<Record<string, PlatformDefinition>>(
  (acc, platform) => {
    acc[platform.id] = platform;
    return acc;
  },
  {}
);

type RemoteRouteMeta = {
  path: string;
  label: string;
  icon: string;
  accent: string;
  remoteName: string;
};

const REMOTE_ROUTE_META: Record<string, RemoteRouteMeta> = {
  sales: {
    path: 'sales',
    label: 'Vendas',
    icon: 'store',
    accent: HOME_PLATFORM_INDEX['remote-sales'].accent,
    remoteName: 'remote-sales'
  },
  gde: {
    path: 'gde',
    label: 'Gestão de Empresas',
    icon: 'business_center',
    accent: HOME_PLATFORM_INDEX['remote-gde'].accent,
    remoteName: 'remote-gde'
  },
  'conta-corrente': {
    path: 'conta-corrente',
    label: 'Conta Corrente',
    icon: 'account_balance_wallet',
    accent: HOME_PLATFORM_INDEX['remote-accounts'].accent,
    remoteName: 'remote-accounts'
  }
};

const getRemoteMeta = (path?: string | null) => (path ? REMOTE_ROUTE_META[path] ?? null : null);

const REMOTE_META_BY_NAME = Object.values(REMOTE_ROUTE_META).reduce<Record<string, RemoteRouteMeta>>(
  (acc, meta) => {
    acc[meta.remoteName] = meta;
    return acc;
  },
  {}
);

const getRemoteMetaByName = (remoteName: string) => REMOTE_META_BY_NAME[remoteName] ?? null;

const REMOTE_INFO_PATH = 'remote-info.json';
const getRemoteBaseUrl = (entryUrl: string) =>
  entryUrl.endsWith('/') ? entryUrl : entryUrl.replace(/\/[^/]*$/, '/');

const HOME_MODULES: ModuleDefinition[] = [
  {
    id: 'sales-vendas',
    name: 'Vendas',
    platformId: 'remote-sales',
    platformLabel: 'Vendas',
    icon: 'store',
    rating: 4.8,
    route: '/sales',
    keywords: ['comercial', 'loja']
  },
  {
    id: 'credito-simulacao',
    name: 'Simulacao',
    platformId: 'remote-credito',
    platformLabel: 'Credito (v19)',
    icon: 'credit_score',
    rating: 4.4,
    route: '/credito',
    keywords: ['credito', 'simulacao', 'limite', 'concessao', 'ofertas']
  },
  {
    id: 'credito-analise',
    name: 'Analise de risco',
    platformId: 'remote-credito',
    platformLabel: 'Credito (v19)',
    icon: 'analytics',
    rating: 4.1,
    route: '/credito/analise',
    keywords: ['credito', 'analise', 'risco']
  },
  {
    id: 'credito-painel',
    name: 'Painel da carteira',
    platformId: 'remote-credito',
    platformLabel: 'Credito (v19)',
    icon: 'dashboard',
    rating: 4.0,
    route: '/credito/painel',
    keywords: ['credito', 'painel', 'carteira']
  },
  {
    id: 'accounts-conta-corrente',
    name: 'Conta corrente',
    platformId: 'remote-accounts',
    platformLabel: 'Conta Corrente',
    icon: 'account_balance_wallet',
    rating: 4.2,
    route: '/conta-corrente',
    keywords: ['conta', 'corrente', 'conta corrente']
  },
  {
    id: 'accounts-drawer-gde',
    name: 'Drawer do GDE',
    platformId: 'remote-accounts',
    platformLabel: 'Conta Corrente',
    icon: 'list_alt',
    rating: 4.6,
    route: '/conta-corrente?drawer=contract',
    keywords: ['drawer', 'gde', 'contrato', 'remoto']
  },
  {
    id: 'accounts-extratos',
    name: 'Extratos',
    platformId: 'remote-accounts',
    platformLabel: 'Conta Corrente',
    icon: 'list_alt',
    rating: 3.7,
    route: '/conta-corrente/extratos',
    keywords: ['extrato', 'conta corrente']
  },
  {
    id: 'accounts-limites',
    name: 'Limites e bloqueios',
    platformId: 'remote-accounts',
    platformLabel: 'Conta Corrente',
    icon: 'verified_user',
    rating: 4.3,
    route: '/conta-corrente/limites-e-bloqueios'
  },
  {
    id: 'gde-home',
    name: 'GDE',
    platformId: 'remote-gde',
    platformLabel: 'Gestão de Empresas',
    icon: 'business_center',
    rating: 4.4,
    route: '/gde',
    keywords: ['gde']
  },
  {
    id: 'gde-contas-pagar',
    name: 'Contas a pagar',
    platformId: 'remote-gde',
    platformLabel: 'Gestão de Empresas',
    icon: 'list_alt',
    rating: 4.7,
    route: '/gde/contas-a-pagar',
    keywords: ['gde', 'contas a pagar']
  },
  {
    id: 'gde-inclusao',
    name: 'Inclusão parcela a pagar',
    platformId: 'remote-gde',
    platformLabel: 'Gestão de Empresas',
    icon: 'task_alt',
    rating: 3.9,
    route: '/gde/inclusao-parcela-a-pagar',
    keywords: ['gde', 'inclusao']
  },
  {
    id: 'gde-alteracao',
    name: 'Alteração parcela a pagar',
    platformId: 'remote-gde',
    platformLabel: 'Gestão de Empresas',
    icon: 'edit_note',
    rating: 4.5,
    route: '/gde/alteracao-parcela-a-pagar',
    keywords: ['gde', 'alteracao']
  },
  {
    id: 'gde-adiantamento',
    name: 'Adiantamento de pagamento',
    platformId: 'remote-gde',
    platformLabel: 'Gestão de Empresas',
    icon: 'note_add',
    rating: 3.8,
    route: '/gde/adiantamento-de-pagamento',
    keywords: ['gde', 'adiantamento']
  }
];

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const isRoutableModule = (module: ModuleDefinition) =>
  typeof module.route === 'string' && module.route.trim().length > 0;

const sortModulesByAvailability = (modules: ModuleDefinition[]) => {
  return modules.filter(isRoutableModule);
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <section class="home" (click)="closeMenus()">
      <div class="home-header">
        <span class="home-kicker">Arquitetura do Host Shell</span>
        @if (showHero() && !hasFavorites()) {
          <figure class="home-hero">
            <button class="hero-close" type="button" (click)="dismissHero($event)">
              <mat-icon aria-hidden="true">close</mat-icon>
            </button>
            <img
              class="hero-image"
              src="/assets/images/home_host_shell.png"
              alt="Mapa visual do Host Shell e remotes"
              width="1536"
              height="1024"
              decoding="async"
            />
          </figure>
        }
        @if (hasFavorites()) {
          <section class="favorites">
            <div class="favorites-header">
              <div>
                <span class="favorites-kicker">Favoritos</span>
                <h2>Seus módulos favoritos</h2>
              </div>
              <span class="favorites-count">{{ favoriteModules().length }} selecionados</span>
            </div>
            <div class="favorites-grid">
              @for (module of favoriteModules(); track module.id) {
                <article
                  class="module-card module-card--compact"
                  [style.--platform-accent]="getPlatformAccent(module.platformId)"
                >
                  <div class="module-accent"></div>
                  <span class="module-accent-bar" aria-hidden="true"></span>
                  <div class="module-icon">
                    <mat-icon aria-hidden="true">{{ module.icon }}</mat-icon>
                  </div>
                  <div class="module-body">
                    <span class="module-name">{{ module.name }}</span>
                    <span class="module-platform">{{ module.platformLabel }}</span>
                  </div>
                  <button
                    class="module-cta"
                    type="button"
                    (click)="navigateTo(module, $event)"
                    [disabled]="!module.route"
                  >
                    {{ module.route ? 'Acessar' : 'Em breve' }}
                  </button>
                </article>
              }
            </div>
          </section>
        }
      </div>

      <div class="home-toolbar">
        <label class="home-search">
          <mat-icon aria-hidden="true">search</mat-icon>
          <input
            type="search"
            placeholder="Nome do módulo"
            [value]="searchQuery()"
            (input)="updateSearch($event)"
          />
          @if (searchQuery()) {
            <button class="search-clear" type="button" (click)="clearSearch($event)">
              <mat-icon aria-hidden="true">close</mat-icon>
            </button>
          }
        </label>
        <div class="home-filters" role="group" aria-label="Filtros">
          @for (filter of filters; track filter.id) {
            <button
              class="filter-chip"
              type="button"
              [class.active]="activeFilter() === filter.id"
              (click)="setFilter(filter.id, $event)"
            >
              <span class="filter-check">
                @if (activeFilter() === filter.id) {
                  <mat-icon aria-hidden="true">check</mat-icon>
                }
              </span>
              {{ filter.label }}
            </button>
          }
        </div>
        <div class="results-row">
          <span class="results-count">
            {{ filteredModules().length }} módulo{{ filteredModules().length === 1 ? '' : 's' }}
          </span>
          <span class="results-hint">Selecione um card para acessar o módulo.</span>
        </div>
      </div>

      @if (!platformSections().length) {
        <div class="home-empty">
          <div class="home-empty-icon">
            <mat-icon aria-hidden="true">search</mat-icon>
          </div>
          <div>
            <h3>Nenhum módulo encontrado</h3>
            <p>Ajuste o filtro ou tente outro termo de busca.</p>
          </div>
        </div>
      }

      @for (section of platformSections(); track section.platform.id) {
        <section class="platform-section" [style.--platform-accent]="section.platform.accent">
          <header class="platform-header">
            <div class="platform-icon">
              <mat-icon aria-hidden="true">{{ section.platform.icon }}</mat-icon>
            </div>
            <div class="platform-title">
              <span class="platform-kicker">{{ getPlatformKicker(section.platform) }}</span>
              <h3>{{ section.platform.label }}</h3>
              <p class="platform-summary">{{ section.platform.summary }}</p>
              <div class="platform-tags">
                <span
                  class="platform-tag"
                  [class.is-accent]="section.platform.kind === 'web-component'"
                >
                  {{ getPlatformKindLabel(section.platform) }}
                </span>
                <span class="platform-tag">
                  {{ section.modules.length }} módulo{{ section.modules.length === 1 ? '' : 's' }}
                </span>
              </div>
            </div>
            <button
              class="platform-cta"
              type="button"
              (click)="navigateToPlatform(section.platform, $event)"
              [disabled]="!section.platform.route"
            >
              Acessar plataforma
            </button>
          </header>
          <div class="platform-grid">
            @for (module of section.modules; track module.id) {
              <article class="module-card" [class.is-favorite]="isFavorite(module.id)">
                <span class="module-accent-bar" aria-hidden="true"></span>
                <div class="module-icon">
                  <mat-icon aria-hidden="true">{{ module.icon }}</mat-icon>
                </div>
                <div class="module-body">
                  <div class="module-title-row">
                    <span class="module-name">{{ module.name }}</span>
                    @if (isFavorite(module.id)) {
                      <span class="module-favorite" aria-label="Favorito">
                        <mat-icon aria-hidden="true">star</mat-icon>
                      </span>
                    }
                  </div>
                  <div class="module-meta">
                    <span class="module-badge" [class.is-accent]="isAccentModuleBadge(module)">
                      {{ getModuleBadgeLabel(module) }}
                    </span>
                    @if (getRating(module)) {
                      <span
                        class="module-rating"
                        [style.--rating]="getRating(module)"
                        [attr.aria-label]="'Avaliação ' + getRating(module) + ' de 5'"
                      ></span>
                    } @else {
                      <button class="module-rate" type="button" (click)="rateModule(module, $event)">
                        Avaliar
                      </button>
                    }
                  </div>
                </div>
                <div class="module-actions">
                  <div class="module-menu-wrapper">
                    <button
                      class="module-menu-button"
                      type="button"
                      aria-label="Ações"
                      (click)="toggleMenu(module.id, $event)"
                    >
                      <mat-icon aria-hidden="true">more_vert</mat-icon>
                    </button>
                    @if (activeMenuId() === module.id) {
                      <div class="module-menu" role="menu" (click)="captureMenu($event)">
                        <button
                          class="module-menu-item"
                          type="button"
                          role="menuitem"
                          (click)="navigateTo(module, $event)"
                          [disabled]="!module.route"
                        >
                          <mat-icon aria-hidden="true">arrow_forward</mat-icon>
                          {{ module.route ? 'Acessar' : 'Em breve' }}
                        </button>
                        <button
                          class="module-menu-item"
                          type="button"
                          role="menuitem"
                          (click)="toggleFavorite(module.id, $event)"
                        >
                          <mat-icon aria-hidden="true">{{ isFavorite(module.id) ? 'star' : 'star_border' }}</mat-icon>
                          {{ isFavorite(module.id) ? 'Remover favorito' : 'Favoritar' }}
                        </button>
                        <button
                          class="module-menu-item"
                          type="button"
                          role="menuitem"
                          (click)="shareModule(module, $event)"
                          [disabled]="!module.route"
                        >
                          <mat-icon aria-hidden="true">share</mat-icon>
                          Compartilhar
                        </button>
                      </div>
                    }
                  </div>
                </div>
              </article>
            }
          </div>
        </section>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .home {
        display: flex;
        flex-direction: column;
        gap: 1.75rem;
        min-height: 100%;
      }

      .home mat-icon {
        font-style: normal;
        font-size: inherit;
        height: 1em;
        line-height: 1;
        width: 1em;
      }

      .home-kicker {
        font-size: 0.85rem;
        font-weight: 600;
        color: color-mix(in srgb, var(--color-surface-text-default-high, #0f2b33) 70%, transparent);
      }

      .home-hero {
        margin-top: 0.75rem;
        border-radius: 26px;
        position: relative;
        overflow: hidden;
        background: #0b5b56;
        box-shadow: 0 18px 28px rgba(0, 24, 30, 0.2);
        height: clamp(260px, 24vw, 420px);
      }

      .hero-close {
        position: absolute;
        top: 0.9rem;
        right: 1rem;
        width: 32px;
        height: 32px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.35);
        background: rgba(255, 255, 255, 0.12);
        color: #ffffff;
        display: grid;
        place-items: center;
        cursor: pointer;
        z-index: 1;
      }

      .hero-image {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
      }

      .favorites {
        margin-top: 1rem;
        padding: 1.25rem 1.5rem;
        background: var(--color-surface-background-light, #ffffff);
        border-radius: 24px;
        border: 1px solid var(--color-surface-stroke-low, #e4e8ee);
        box-shadow: 0 12px 24px rgba(0, 24, 30, 0.08);
      }

      .favorites-header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 1rem;
      }

      .favorites-kicker {
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #0a9489;
      }

      .favorites-header h2 {
        margin: 0.25rem 0 0;
        font-size: 1.25rem;
        color: var(--color-surface-text-default-high, #0f2b33);
      }

      .favorites-count {
        font-size: 0.75rem;
        color: color-mix(in srgb, var(--color-surface-text-default-high, #0f2b33) 60%, transparent);
        font-weight: 600;
      }

      .favorites-grid {
        margin-top: 1rem;
        display: grid;
        gap: 0.75rem;
        grid-template-columns: repeat(auto-fit, 300px);
        justify-content: start;
      }

      .home-toolbar {
        display: grid;
        grid-template-columns: minmax(220px, 360px) 1fr;
        gap: 0.85rem 1.2rem;
        align-items: center;
      }

      .home-search {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.6rem 0.85rem;
        border-radius: 12px;
        border: 1px solid var(--color-surface-stroke-low, #e4e8ee);
        background: var(--color-surface-background-light, #ffffff);
        box-shadow: 0 10px 20px rgba(0, 24, 30, 0.06);
        max-width: 360px;
      }

      .home-search input {
        border: 0;
        outline: none;
        flex: 1;
        font-size: 0.95rem;
        color: var(--color-surface-text-default-high, #0f2b33);
        background: transparent;
      }

      .search-clear {
        border: 0;
        background: transparent;
        color: var(--color-surface-text-default-medium, #68848c);
        cursor: pointer;
      }

      .home-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
      }

      .filter-chip {
        border: 1px solid var(--color-surface-stroke-low, #e4e8ee);
        background: var(--color-surface-background-light, #ffffff);
        border-radius: 999px;
        padding: 0.35rem 0.75rem 0.35rem 0.45rem;
        font-size: 0.72rem;
        font-weight: 600;
        color: var(--color-surface-text-default-high, #3a4a52);
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .filter-chip.active {
        border-color: color-mix(in srgb, var(--shell-primary, #2f6fed) 60%, #ffffff);
        background: color-mix(in srgb, var(--shell-primary, #2f6fed) 12%, #ffffff);
        color: var(--shell-primary, #2f6fed);
      }

      .filter-check {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: color-mix(in srgb, var(--shell-primary, #2f6fed) 12%, #ffffff);
        color: var(--shell-primary, #2f6fed);
        font-size: 0.65rem;
      }

      .results-row {
        display: flex;
        align-items: center;
        gap: 1rem;
        font-size: 0.78rem;
        color: color-mix(in srgb, var(--color-surface-text-default-high, #0f2b33) 60%, transparent);
        grid-column: 1 / -1;
      }

      .results-count {
        font-weight: 700;
      }

      .home-empty {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.4rem;
        border-radius: 20px;
        border: 1px dashed var(--color-surface-stroke-low, #d7dde4);
        background: color-mix(
          in srgb,
          var(--color-surface-background-light, #ffffff) 85%,
          transparent
        );
      }

      .home-empty h3 {
        margin: 0 0 0.25rem;
        font-size: 1.1rem;
      }

      .home-empty p {
        margin: 0;
        color: color-mix(in srgb, var(--color-surface-text-default-high, #0f2b33) 65%, transparent);
      }

      .home-empty-icon {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        background: color-mix(
          in srgb,
          var(--shell-primary, #2f6fed) 14%,
          var(--color-surface-background-light, #ffffff)
        );
        color: var(--shell-primary, #2f6fed);
        display: grid;
        place-items: center;
        font-size: 1.2rem;
      }

      .platform-section {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
        padding: 0.9rem 1rem 1.1rem;
        border-radius: 22px;
        border: 1px solid color-mix(
          in srgb,
          var(--platform-accent) 18%,
          var(--color-surface-stroke-low, #e4e8ee)
        );
        background: linear-gradient(
          180deg,
          color-mix(
            in srgb,
            var(--platform-accent) 10%,
            var(--color-surface-background-light, #ffffff)
          ),
          var(--color-surface-background-light, #ffffff) 65%
        );
      }

      .platform-header {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 0.85rem 1.2rem;
      }

      .platform-icon {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        background: color-mix(
          in srgb,
          var(--platform-accent) 16%,
          var(--color-surface-background-light, #ffffff)
        );
        color: var(--platform-accent);
        display: grid;
        place-items: center;
        font-size: 1.2rem;
        border: 1px solid color-mix(
          in srgb,
          var(--platform-accent) 30%,
          var(--color-surface-stroke-low, #ffffff)
        );
      }

      .platform-kicker {
        text-transform: uppercase;
        font-size: 0.65rem;
        letter-spacing: 0.08em;
        font-weight: 700;
        color: color-mix(in srgb, var(--platform-accent) 70%, #1d2b36);
      }

      .platform-title {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .platform-title h3 {
        margin: 0.25rem 0 0;
        font-size: 1.2rem;
        color: var(--color-surface-text-default-high, #0f2b33);
      }

      .platform-summary {
        margin: 0;
        font-size: 0.78rem;
        color: color-mix(in srgb, var(--color-surface-text-default-high, #0f2b33) 60%, transparent);
      }

      .platform-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }

      .platform-tag {
        font-size: 0.62rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        padding: 0.15rem 0.45rem;
        border-radius: 999px;
        border: 1px solid var(--color-surface-stroke-low, #e4e8ee);
        background: var(--color-surface-background-medium, #f4f7f9);
        color: var(--color-surface-text-default-medium, #53626b);
      }

      .platform-tag.is-accent {
        background: color-mix(in srgb, var(--platform-accent) 12%, #ffffff);
        color: var(--platform-accent);
        border-color: color-mix(in srgb, var(--platform-accent) 35%, #e4e8ee);
      }

      .platform-cta {
        border: 1px solid color-mix(
          in srgb,
          var(--platform-accent) 30%,
          var(--color-surface-stroke-low, #e4e8ee)
        );
        background: color-mix(
          in srgb,
          var(--platform-accent) 8%,
          var(--color-surface-background-light, #ffffff)
        );
        color: var(--platform-accent);
        border-radius: 999px;
        padding: 0.35rem 0.9rem;
        font-size: 0.7rem;
        font-weight: 700;
        cursor: pointer;
        justify-self: end;
      }

      .platform-cta:disabled {
        color: var(--color-surface-text-default-medium, #9aa7af);
        cursor: not-allowed;
        border-color: var(--color-surface-stroke-low, #e4e8ee);
        background: var(--color-surface-background-medium, #f4f7f9);
      }

      .platform-grid {
        display: grid;
        gap: 0.9rem;
        grid-template-columns: repeat(auto-fit, 300px);
        justify-content: start;
      }

      .platform-grid .module-card {
        border-color: color-mix(
          in srgb,
          var(--platform-accent) 18%,
          var(--color-surface-stroke-low, #e4e8ee)
        );
        background: color-mix(
          in srgb,
          var(--platform-accent) 4%,
          var(--color-surface-background-light, #ffffff)
        );
      }

      .module-card {
        background: var(--color-surface-background-light, #ffffff);
        border-radius: 12px;
        border: 1px solid var(--color-surface-stroke-low, #e4e8ee);
        padding: 0.55rem 0.6rem 0.55rem 0.9rem;
        width: 300px;
        height: 80px;
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 0.6rem;
        align-items: center;
        position: relative;
        box-sizing: border-box;
        box-shadow: 0 2px 6px rgba(0, 24, 30, 0.08);
        transition: box-shadow 0.2s ease, border 0.2s ease;
      }

      .module-card:hover {
        box-shadow: 0 6px 12px rgba(0, 24, 30, 0.1);
        border-color: color-mix(
          in srgb,
          var(--platform-accent, #2f6fed) 25%,
          var(--color-surface-stroke-low, #e4e8ee)
        );
      }

      .module-card.is-favorite {
        border-color: color-mix(
          in srgb,
          var(--platform-accent) 45%,
          var(--color-surface-stroke-low, #e4e8ee)
        );
      }

      .module-card--compact {
        grid-template-columns: auto 1fr auto;
        box-shadow: none;
      }

      .module-accent {
        position: absolute;
        inset: 0;
        border-radius: inherit;
        box-shadow: inset 0 0 0 1px color-mix(
          in srgb,
          var(--platform-accent, #2f6fed) 28%,
          transparent
        );
        pointer-events: none;
      }

      .module-accent-bar {
        position: absolute;
        top: 0.45rem;
        bottom: 0.45rem;
        left: 0.35rem;
        width: 4px;
        border-radius: 999px;
        background: linear-gradient(
          180deg,
          color-mix(
            in srgb,
            var(--platform-accent, #2f6fed) 78%,
            var(--color-surface-background-light, #ffffff)
          ),
          var(--platform-accent, #2f6fed)
        );
        opacity: 0.8;
        pointer-events: none;
      }

      .module-icon {
        width: 32px;
        height: 32px;
        border-radius: 0;
        background: transparent;
        color: var(--platform-accent, #2f6fed);
        display: grid;
        place-items: center;
        font-size: 1.5rem;
        line-height: 1;
        border: 0;
      }

      .module-body {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        min-width: 0;
      }

      .module-title-row {
        display: flex;
        align-items: center;
        gap: 0.35rem;
      }

      .module-name {
        font-weight: 600;
        font-size: 0.86rem;
        line-height: 1.2;
        color: var(--color-surface-text-default-high, #0f2b33);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .module-platform {
        font-size: 0.72rem;
        color: color-mix(in srgb, var(--color-surface-text-default-high, #0f2b33) 60%, transparent);
      }

      .platform-grid .module-platform {
        display: none;
      }

      .module-meta {
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }

      .module-badge {
        font-size: 0.62rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        padding: 0.15rem 0.45rem;
        border-radius: 999px;
        border: 1px solid var(--color-surface-stroke-low, #e4e8ee);
        background: var(--color-surface-background-medium, #f4f7f9);
        color: var(--color-surface-text-default-medium, #53626b);
      }

      .module-badge.is-accent {
        background: color-mix(in srgb, var(--platform-accent, #2f6fed) 12%, #ffffff);
        color: var(--platform-accent, #2f6fed);
        border-color: color-mix(in srgb, var(--platform-accent, #2f6fed) 35%, #e4e8ee);
      }

      .module-favorite {
        font-size: 0.8rem;
        color: #e4a800;
      }

      .module-actions {
        display: flex;
        align-items: center;
        justify-content: center;
        justify-self: end;
        align-self: stretch;
      }

      .module-menu-wrapper {
        position: relative;
      }

      .module-rating {
        --rating: 0;
        --star-size: 0.75rem;
        --star-color: #f4b63d;
        --star-bg: #d7dde3;
        position: relative;
        display: inline-block;
        font-size: var(--star-size);
        line-height: 1;
        width: calc(var(--star-size) * 5);
        height: var(--star-size);
      }

      .module-rating::before,
      .module-rating::after {
        content: '★★★★★';
        position: absolute;
        top: 0;
        left: 0;
        white-space: nowrap;
      }

      .module-rating::before {
        color: var(--star-bg);
      }

      .module-rating::after {
        color: var(--star-color);
        width: calc(var(--rating) * 20%);
        overflow: hidden;
      }

      .module-rate {
        border: 1px solid color-mix(
          in srgb,
          var(--platform-accent, #2f6fed) 35%,
          var(--color-surface-stroke-low, #e4e8ee)
        );
        color: var(--platform-accent, #2f6fed);
        background: color-mix(
          in srgb,
          var(--platform-accent, #2f6fed) 8%,
          var(--color-surface-background-light, #ffffff)
        );
        border-radius: 999px;
        padding: 0.1rem 0.45rem;
        font-size: 0.6rem;
        font-weight: 600;
        cursor: pointer;
      }

      .module-menu-button {
        width: 32px;
        height: 32px;
        border-radius: 999px;
        border: 1px solid transparent;
        background: transparent;
        color: var(--color-surface-text-default-medium, #6c7b85);
        display: grid;
        place-items: center;
        cursor: pointer;
        line-height: 1;
      }

      .module-menu-button mat-icon {
        font-size: 1.1rem;
        height: 1em;
        width: 1em;
      }

      .module-menu-button:hover {
        border-color: color-mix(
          in srgb,
          var(--platform-accent, #2f6fed) 35%,
          var(--color-surface-stroke-low, #e4e8ee)
        );
        background: color-mix(
          in srgb,
          var(--platform-accent, #2f6fed) 10%,
          var(--color-surface-background-light, #ffffff)
        );
        color: var(--color-surface-text-default-high, #2a3c44);
      }

      .module-menu {
        position: absolute;
        top: calc(100% + 0.2rem);
        right: 0;
        background: var(--color-surface-background-light, #ffffff);
        border-radius: 10px;
        border: 1px solid var(--color-surface-stroke-low, #e4e8ee);
        box-shadow: 0 8px 16px rgba(0, 24, 30, 0.12);
        padding: 0.25rem;
        display: grid;
        gap: 0.15rem;
        min-width: 150px;
        z-index: 5;
      }

      .module-menu-item {
        border: 0;
        background: transparent;
        padding: 0.32rem 0.5rem;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.7rem;
        font-weight: 600;
        color: var(--color-surface-text-default-medium, #46555f);
        cursor: pointer;
      }

      .module-menu-item:disabled {
        color: #9aa7af;
        cursor: not-allowed;
      }

      .module-menu-item:hover:not(:disabled) {
        background: color-mix(
          in srgb,
          var(--platform-accent, #2f6fed) 12%,
          var(--color-surface-background-light, #ffffff)
        );
        color: var(--platform-accent, #2f6fed);
      }

      .module-cta {
        border: 1px solid var(--color-surface-stroke-low, #e4e8ee);
        background: var(--color-surface-background-medium, #f7fafb);
        border-radius: 999px;
        padding: 0.3rem 0.7rem;
        font-size: 0.72rem;
        font-weight: 600;
        cursor: pointer;
        color: var(--color-surface-text-default-high, #2a3c44);
      }

      .module-cta:disabled {
        color: var(--color-surface-text-default-medium, #9aa7af);
        cursor: not-allowed;
      }

      @media (max-width: 960px) {
        .hero-image {
          object-position: 15% center;
        }
      }

      @media (max-width: 820px) {
        .platform-header {
          grid-template-columns: 1fr;
          align-items: start;
        }

        .platform-cta {
          justify-self: start;
        }
      }

      @media (max-width: 700px) {
        .home-hero {
          padding: 1.3rem;
        }

        .home-toolbar {
          grid-template-columns: 1fr;
        }

        .home-search {
          max-width: none;
        }
      }

      @media (max-width: 640px) {
        .favorites-grid,
        .platform-grid {
          grid-template-columns: 1fr;
          justify-content: stretch;
        }

        .module-card {
          width: 100%;
        }
      }

      .aurora-dark .filter-chip {
        border-color: var(--color-surface-stroke-medium, #364b5d);
        background: var(--color-surface-background-light, #223140);
        color: var(--color-surface-text-default-high, #f0f5fb);
      }

      .aurora-dark .filter-chip.active {
        border-color: color-mix(
          in srgb,
          var(--shell-primary, #8ab4ff) 45%,
          var(--color-surface-stroke-medium, #364b5d)
        );
        background: color-mix(
          in srgb,
          var(--shell-primary, #8ab4ff) 18%,
          var(--color-surface-background-light, #223140)
        );
        color: color-mix(in srgb, var(--shell-primary, #8ab4ff) 85%, #ffffff);
      }

      .aurora-dark .filter-check {
        background: color-mix(
          in srgb,
          var(--shell-primary, #8ab4ff) 18%,
          var(--color-surface-background-light, #223140)
        );
        color: color-mix(in srgb, var(--shell-primary, #8ab4ff) 85%, #ffffff);
      }
    `
  ]
})
export class HomeComponent {
  private readonly router = inject(Router);

  readonly filters = HOME_FILTERS;
  readonly searchQuery = signal('');
  readonly activeFilter = signal('todos');
  readonly favoriteIds = signal<Set<string>>(new Set());
  readonly activeMenuId = signal<string | null>(null);
  readonly showHero = signal(true);
  readonly userRatings = signal<Record<string, number>>({});

  readonly filteredModules = computed(() => {
    const filter = this.activeFilter();
    const query = normalizeText(this.searchQuery());

    return HOME_MODULES.filter((module) => {
      if (!isRoutableModule(module)) {
        return false;
      }

      if (filter !== 'todos' && module.platformId !== filter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        module.name,
        module.platformLabel,
        ...(module.keywords ?? [])
      ]
        .map(normalizeText)
        .join(' ');

      return haystack.includes(query);
    });
  });

  readonly platformSections = computed(() => {
    const modules = this.filteredModules();
    return HOME_PLATFORMS.map((platform) => ({
      platform,
      modules: sortModulesByAvailability(modules.filter((module) => module.platformId === platform.id))
    })).filter((section) => section.modules.length > 0);
  });

  readonly favoriteModules = computed(() => {
    const favorites = this.favoriteIds();
    return sortModulesByAvailability(HOME_MODULES.filter((module) => favorites.has(module.id)));
  });

  hasFavorites() {
    return this.favoriteModules().length > 0;
  }

  getPlatformAccent(platformId: string) {
    return HOME_PLATFORM_INDEX[platformId]?.accent ?? '#2f6fed';
  }

  getPlatformKicker(_platform: PlatformDefinition) {
    return 'Plataforma';
  }

  getPlatformKindLabel(platform: PlatformDefinition) {
    return platform.kind === 'web-component' ? 'Web Component' : 'Native Federation';
  }

  navigateToPlatform(platform: PlatformDefinition, event: Event) {
    event.stopPropagation();
    if (!platform.route) {
      return;
    }
    this.router.navigateByUrl(platform.route);
  }

  updateSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.searchQuery.set(value);
  }

  clearSearch(event: Event) {
    event.stopPropagation();
    this.searchQuery.set('');
  }

  setFilter(filter: string, event: Event) {
    event.stopPropagation();
    this.activeFilter.set(filter);
  }

  getRating(module: ModuleDefinition) {
    return this.userRatings()[module.id] ?? module.rating;
  }

  isCrossAppModule(module: ModuleDefinition) {
    const keywordMatches = (module.keywords ?? []).map(normalizeText);
    if (keywordMatches.includes('drawer')) {
      return true;
    }
    if (module.route && normalizeText(module.route).includes('drawer=')) {
      return true;
    }
    return normalizeText(module.name).includes('drawer');
  }

  isWebComponentModule(module: ModuleDefinition) {
    return HOME_PLATFORM_INDEX[module.platformId]?.kind === 'web-component';
  }

  isAccentModuleBadge(module: ModuleDefinition) {
    return this.isCrossAppModule(module) || this.isWebComponentModule(module);
  }

  getModuleBadgeLabel(module: ModuleDefinition) {
    if (this.isCrossAppModule(module)) {
      return 'Interapp';
    }
    if (this.isWebComponentModule(module)) {
      return 'Web Component';
    }
    return 'Federado';
  }

  rateModule(module: ModuleDefinition, event: Event) {
    event.stopPropagation();
    const next = { ...this.userRatings() };
    next[module.id] = 4.5;
    this.userRatings.set(next);
  }

  toggleFavorite(id: string, event: Event) {
    event.stopPropagation();
    const next = new Set(this.favoriteIds());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.favoriteIds.set(next);
    this.activeMenuId.set(null);
  }

  isFavorite(id: string) {
    return this.favoriteIds().has(id);
  }

  toggleMenu(id: string, event: Event) {
    event.stopPropagation();
    this.activeMenuId.set(this.activeMenuId() === id ? null : id);
  }

  captureMenu(event: Event) {
    event.stopPropagation();
  }

  closeMenus() {
    this.activeMenuId.set(null);
  }

  dismissHero(event: Event) {
    event.stopPropagation();
    this.showHero.set(false);
  }

  navigateTo(module: ModuleDefinition, event: Event) {
    event.stopPropagation();
    if (!module.route) {
      return;
    }
    this.activeMenuId.set(null);
    this.router.navigateByUrl(module.route);
  }

  async shareModule(module: ModuleDefinition, event: Event) {
    event.stopPropagation();
    if (!module.route || typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }
    const url = `${window.location.origin}${module.route}`;
    await navigator.clipboard.writeText(url);
    this.activeMenuId.set(null);
  }
}

type ShellTheme = 'aurora-light' | 'aurora-dark' | 'marinho-light' | 'citrico-light';

type ThemeOption = {
  id: ShellTheme;
  label: string;
  icon: string;
};

type RemoteMenuConfig = {
  name: string;
  menuPath: string;
};

type WebComponentMenuConfig = {
  name: string;
  menuPath: string;
  baseUrl: string;
  routeSegment: string;
  label: string;
};

const normalizeString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const normalizeStringRecord = (value: unknown): Record<string, string> | undefined => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const normalized: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    const normalizedValue = normalizeString(entry);
    if (normalizedValue) {
      normalized[key] = normalizedValue;
    }
  }

  return Object.keys(normalized).length ? normalized : undefined;
};

const normalizeStatsRecord = (value: unknown): Record<string, string | number> | undefined => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const normalized: Record<string, string | number> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry === 'number' && Number.isFinite(entry)) {
      normalized[key] = entry;
      continue;
    }
    const normalizedValue = normalizeString(entry);
    if (normalizedValue) {
      normalized[key] = normalizedValue;
    }
  }

  return Object.keys(normalized).length ? normalized : undefined;
};

const normalizeRemoteInfoPayload = (raw: unknown): RemoteInfoPayload | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const name = normalizeString(record['name']);
  const label = normalizeString(record['label']);
  const angular = normalizeString(record['angular']);
  const libs = normalizeStringRecord(record['libs']);
  const stats = normalizeStatsRecord(record['stats']);

  if (!name && !label && !angular && !libs && !stats) {
    return null;
  }

  return { name, label, angular, libs, stats };
};

const normalizeMenuPayload = (raw: unknown, fallback: MenuGroupDefaults): MenuGroup | null => {
  if (raw === null || raw === undefined) {
    return null;
  }

  if (!Array.isArray(raw) && typeof raw !== 'object') {
    return null;
  }

  return normalizeRemoteMenuPayload(raw, fallback);
};

const SHELL_MENU_GROUP: MenuGroup = {
  id: 'shell',
  label: 'Shell',
  order: 0,
  items: [
    { label: 'Inicial', path: '/home', icon: 'home', order: 0, exact: true }
  ]
};

const DEFAULT_REMOTE_MENU_CONFIG: RemoteMenuConfig[] = [
  { name: 'remote-sales', menuPath: 'menu.json' },
  { name: 'remote-gde', menuPath: 'menu.json' },
  { name: 'remote-accounts', menuPath: 'menu.json' }
];

const resolveRemoteMenuConfig = (): RemoteMenuConfig[] => {
  const config = getRuntimeConfig();
  const remotes = config.remotes;
  if (!remotes || !Object.keys(remotes).length) {
    return DEFAULT_REMOTE_MENU_CONFIG;
  }

  const defaultsByName = DEFAULT_REMOTE_MENU_CONFIG.reduce<Record<string, RemoteMenuConfig>>(
    (acc, remote) => {
      acc[remote.name] = remote;
      return acc;
    },
    {}
  );

  const configuredNames = Object.keys(remotes);
  const orderedNames = [
    ...DEFAULT_REMOTE_MENU_CONFIG.map((remote) => remote.name).filter((name) =>
      configuredNames.includes(name)
    ),
    ...configuredNames.filter((name) => !defaultsByName[name])
  ];

  return orderedNames.map((name) => ({
    name,
    menuPath: defaultsByName[name]?.menuPath ?? 'menu.json'
  }));
};

const REMOTE_MENU_CONFIG: RemoteMenuConfig[] = resolveRemoteMenuConfig();
const WEB_COMPONENT_MENU_CONFIG: WebComponentMenuConfig[] = WEB_COMPONENT_CONFIG.map((component) => ({
  name: component.name,
  menuPath: component.menuPath,
  baseUrl: component.baseUrl,
  routeSegment: component.routeSegment,
  label: component.label
}));

const THEME_OPTIONS: ThemeOption[] = [
  { id: 'aurora-light', label: 'Aurora claro', icon: 'wb_sunny' },
  { id: 'aurora-dark', label: 'Aurora escuro', icon: 'nights_stay' },
  { id: 'marinho-light', label: 'Marinho', icon: 'account_balance' },
  { id: 'citrico-light', label: 'Citrico', icon: 'groups' }
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AppShellComponent],
  template: `
    <app-shell
      [currentAppTitle]="currentAppTitle()"
      [currentAppIcon]="currentAppIcon()"
      [currentThemeIcon]="currentThemeIcon()"
      [activeTheme]="activeTheme"
      [isThemeMenuOpen]="isThemeMenuOpen()"
      [themeOptions]="themeOptions"
      [menuGroups]="menuGroups()"
      [menuLoading]="menuLoading()"
      [menuError]="menuError()"
      [remoteLoading]="remoteLoading()"
      [remoteLoadingLabel]="remoteLoadingLabel()"
      [remoteLoadingIcon]="remoteLoadingIcon()"
      [remoteLoadingAccent]="remoteLoadingAccent()"
      [remoteStatusItems]="remoteStatusItems()"
      [activeRemoteStatus]="activeRemoteStatus()"
      [exactMatchOptions]="exactMatchOptions"
      [partialMatchOptions]="partialMatchOptions"
      (toggleThemeMenu)="toggleThemeMenu($event)"
      (captureTopbarMenus)="captureTopbarMenus($event)"
      (closeTopbarMenus)="closeTopbarMenus()"
      (selectTheme)="selectTheme($event)"
      (loadRemoteMenus)="loadRemoteMenus($event ?? false)"
    ></app-shell>
  `
})
export class AppComponent {
  private readonly themes = THEME_OPTIONS.map((option) => option.id);

  readonly exactMatchOptions = { exact: true };
  readonly partialMatchOptions = { exact: false };
  readonly themeOptions = THEME_OPTIONS;

  private readonly remoteMenus = signal<Record<string, MenuGroup>>({});
  private readonly loadedMenuSources = new Set<string>();
  
  private router = inject(Router);
  private readonly telemetry = inject(TelemetryService);
  readonly activeContext = signal<string>('shell');

  private readonly remoteStatusMap = signal<Record<string, RemoteStatusEntry>>({});
  readonly remoteStatusItems = computed(() => {
    const statusMap = this.remoteStatusMap();
    const order = [
      ...REMOTE_MENU_CONFIG.map((remote) => remote.name),
      ...WEB_COMPONENT_CONFIG.map((component) => component.name)
    ];
    return order
      .map((name) => statusMap[name])
      .filter((entry): entry is RemoteStatusEntry => Boolean(entry))
      .map((entry) => this.buildRemoteStatusView(entry.name, entry));
  });
  readonly activeRemoteStatus = computed(() => {
    const context = this.activeContext();
    const meta = getRemoteMeta(context);
    if (!meta) {
      const component = getWebComponentByRoute(context);
      if (!component) {
        return null;
      }
      const entry = this.remoteStatusMap()[component.name];
      return this.buildRemoteStatusView(component.name, entry);
    }
    const entry = this.remoteStatusMap()[meta.remoteName];
    return this.buildRemoteStatusView(meta.remoteName, entry);
  });

  readonly menuLoading = signal(false);
  readonly menuError = signal<string | null>(null);
  readonly isThemeMenuOpen = signal(false);
  readonly remoteLoading = signal(false);
  readonly remoteLoadingLabel = signal('Carregando modulo');
  readonly remoteLoadingIcon = signal('grid_view');
  readonly remoteLoadingAccent = signal('var(--shell-primary)');

  private readonly loadedRemoteRoutes = new Set<string>();
  private readonly remoteRouteLoadStartedAt = new Map<string, number>();
  private remoteLoadingStartedAt = 0;
  private remoteLoadingTimer: ReturnType<typeof setTimeout> | null = null;
  private remoteLoadingFailsafeTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly remoteLoadingMinMs = 1400;
  private readonly remoteLoadingMaxMs = 12000;
  private readonly manifestTimeoutMs = 5000;
  private readonly remoteMenuTimeoutMs = 6500;
  private readonly remoteInfoTimeoutMs = 4500;
  private readonly fetchBreakerOptions: CircuitBreakerOptions = {
    failureThreshold: 2,
    successThreshold: 1,
    openMs: 15000
  };
  private cachedManifest: Record<string, string> | null = null;
  private manifestPromise: Promise<Record<string, string>> | null = null;
  private readonly remoteInfoRequests = new Map<string, Promise<void>>();
  private readonly fetchRetryOptions: RetryOptions = {
    retries: 2,
    baseDelayMs: 350,
    maxDelayMs: 2000,
    jitterMs: 150
  };
  
  readonly menuGroups = computed(() => {
    const currentContext = this.activeContext();
    const remoteMenus = this.remoteMenus();
    const allGroups = [SHELL_MENU_GROUP, ...Object.values(remoteMenus)];

    if (currentContext === 'shell') {
      return [SHELL_MENU_GROUP];
    }

    const contextGroup = allGroups.find(g => g.id === currentContext);
    return contextGroup ? [SHELL_MENU_GROUP, contextGroup] : [SHELL_MENU_GROUP];
  });

  readonly currentAppTitle = computed(() => {
    const context = this.activeContext();
    switch (context) {
      case 'credito': return 'Credito';
      case 'gde': return 'Gestão de Empresas';
      case 'sales': return 'Vendas';
      case 'conta-corrente': return 'Conta Corrente';
      default: return 'Plataforma Corporativa';
    }
  });

  readonly currentAppIcon = computed(() => {
    const context = this.activeContext();
    const meta = getRemoteMeta(context);
    if (meta?.icon) {
      return meta.icon;
    }
    const component = getWebComponentByRoute(context);
    if (component?.icon) {
      return component.icon;
    }
    return context === 'shell' ? 'apps' : 'apps';
  });

  activeTheme: ShellTheme = 'aurora-light';

  constructor() {
    this.setTheme(this.activeTheme);

    this.router.events.pipe(
      filter(
        (event) =>
          event instanceof RouteConfigLoadStart ||
          event instanceof RouteConfigLoadEnd ||
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
      )
    ).subscribe((event) => {
      if (event instanceof RouteConfigLoadStart) {
        const meta = getRemoteMeta(event.route?.path ?? null);
        if (!meta || this.loadedRemoteRoutes.has(meta.path)) {
          return;
        }
        this.remoteRouteLoadStartedAt.set(meta.path, Date.now());
        this.telemetry.info('remote.route.load.start', {
          path: meta.path,
          remoteName: meta.remoteName
        });
        this.setRemoteStatus(meta.remoteName, { status: 'loading' });
        this.startRemoteLoading(meta);
        return;
      }

      if (event instanceof RouteConfigLoadEnd) {
        const meta = getRemoteMeta(event.route?.path ?? null);
        if (meta) {
          this.loadedRemoteRoutes.add(meta.path);
          this.setRemoteStatus(meta.remoteName, { status: 'ready' });
          void this.ensureRemoteStatus(meta.remoteName);
          const startedAt = this.remoteRouteLoadStartedAt.get(meta.path);
          if (startedAt) {
            this.telemetry.timing('remote.route.load', Date.now() - startedAt, {
              path: meta.path,
              remoteName: meta.remoteName
            });
            this.remoteRouteLoadStartedAt.delete(meta.path);
          }
        }
        return;
      }

      if (event instanceof NavigationEnd) {
        this.updateActiveContext(event.urlAfterRedirects);
        this.ensureActiveWebComponentStatus(event.urlAfterRedirects);
        this.stopRemoteLoading();
        return;
      }

      if (event instanceof NavigationCancel) {
        this.telemetry.warn('navigation.cancel', {
          url: event.url,
          reason: event.reason
        });
        this.remoteRouteLoadStartedAt.clear();
        this.stopRemoteLoading();
        return;
      }

      if (event instanceof NavigationError) {
        this.telemetry.error('navigation.error', {
          url: event.url,
          error: event.error
        });
        const mainSegment = this.getMainSegment(event.url);
        const meta = getRemoteMeta(mainSegment);
        if (meta) {
          this.setRemoteStatus(meta.remoteName, { status: 'error', error: 'navigation' });
        }
        this.remoteRouteLoadStartedAt.clear();
        this.stopRemoteLoading();
        return;
      }

      this.stopRemoteLoading();
    });

    // Carrega menus remotos automaticamente ao iniciar
    if (typeof window !== 'undefined') {
      this.loadRemoteMenus();
    }

    this.updateActiveContext(this.router.url);
    this.ensureActiveWebComponentStatus(this.router.url);
  }
  
  updateActiveContext(url: string) {
    const mainSegment = this.getMainSegment(url);
    
    if (!mainSegment || mainSegment === 'home') {
      this.activeContext.set('shell');
    } else if (mainSegment === 'credito') {
      this.activeContext.set('credito');
    } else if (mainSegment === 'gde') {
      this.activeContext.set('gde');
    } else if (mainSegment === 'sales') {
      this.activeContext.set('sales');
    } else if (mainSegment === 'conta-corrente') {
      this.activeContext.set('conta-corrente');
    } else {
      this.activeContext.set('shell');
    }
  }

  private ensureActiveWebComponentStatus(url: string) {
    const mainSegment = this.getMainSegment(url);
    const component = getWebComponentByRoute(mainSegment);
    if (!component) {
      return;
    }

    const existing = this.remoteStatusMap()[component.name];
    if (!existing) {
      this.setRemoteStatus(component.name, {
        status: 'loading',
        url: component.baseUrl
      });
    }

    void this.ensureWebComponentStatus(component);
  }

  private getMainSegment(url: string) {
    const normalized = url.split('?')[0].split('#')[0];
    return normalized.split('/')[1];
  }

  private setRemoteStatus(remoteName: string, patch: Partial<RemoteStatusEntry>) {
    const meta = getRemoteMetaByName(remoteName);
    const webComponent = getWebComponentByName(remoteName);
    const current = this.remoteStatusMap();
    const existing = current[remoteName];
    const base: RemoteStatusEntry = {
      name: remoteName,
      label: meta?.label ?? webComponent?.label ?? remoteName,
      accent: meta?.accent ?? webComponent?.accent ?? 'var(--shell-primary)',
      status: 'missing'
    };
    const next: RemoteStatusEntry = {
      ...base,
      ...(existing ?? {}),
      ...patch
    };
    this.remoteStatusMap.set({ ...current, [remoteName]: next });
  }

  private buildRemoteStatusView(
    remoteName: string,
    entry?: RemoteStatusEntry
  ): RemoteStatusView {
    const meta = getRemoteMetaByName(remoteName);
    const webComponent = getWebComponentByName(remoteName);
    const status = entry?.status ?? 'missing';
    const label = entry?.label ?? meta?.label ?? webComponent?.label ?? remoteName;
    const accent = entry?.accent ?? meta?.accent ?? webComponent?.accent ?? 'var(--shell-primary)';
    const kind = webComponent ? 'web-component' : 'federated';
    const libs = entry?.libs
      ? Object.entries(entry.libs)
          .map(([name, version]) => ({ name, version }))
          .sort((a, b) => a.name.localeCompare(b.name))
      : [];
    const stats = entry?.stats
      ? Object.entries(entry.stats)
          .map(([name, value]) => ({ name, value: String(value) }))
          .sort((a, b) => a.name.localeCompare(b.name))
      : [];

    return {
      name: remoteName,
      label,
      accent,
      status,
      statusLabel: this.getRemoteStatusLabel(status, entry),
      kind,
      url: entry?.url,
      angular: entry?.angular,
      libs,
      stats,
      updatedAt: entry?.updatedAt
    };
  }

  private getRemoteStatusLabel(status: RemoteStatusState, entry?: RemoteStatusEntry) {
    if (status === 'error') {
      return 'Erro';
    }

    if (entry?.error) {
      return 'Sem metadata';
    }

    switch (status) {
      case 'loading':
        return 'Carregando';
      case 'ready':
        return 'Ativo';
      default:
        return 'Aguardando';
    }
  }

  private async ensureRemoteStatus(remoteName: string) {
    if (typeof window === 'undefined') {
      return;
    }

    const existing = this.remoteStatusMap()[remoteName];
    if (existing?.updatedAt || this.remoteInfoRequests.has(remoteName)) {
      return;
    }

    const request = this.fetchRemoteInfo(remoteName)
      .catch(() => undefined)
      .finally(() => {
        this.remoteInfoRequests.delete(remoteName);
      });

    this.remoteInfoRequests.set(remoteName, request);
    await request;
  }

  private async ensureWebComponentStatus(component: WebComponentConfig) {
    if (typeof window === 'undefined') {
      return;
    }

    const existing = this.remoteStatusMap()[component.name];
    if (existing?.updatedAt || this.remoteInfoRequests.has(component.name)) {
      return;
    }

    const request = this.fetchWebComponentInfo(component)
      .catch(() => undefined)
      .finally(() => {
        this.remoteInfoRequests.delete(component.name);
      });

    this.remoteInfoRequests.set(component.name, request);
    await request;
  }

  private async fetchRemoteInfo(remoteName: string) {
    const startedAt = Date.now();
    let manifest: Record<string, string>;

    try {
      manifest = await this.getManifest();
    } catch (error) {
      this.telemetry.warn('remote.info.manifest.error', { remoteName, error });
      this.setRemoteStatus(remoteName, { error: 'manifest' });
      return;
    }

    const entryUrl = manifest[remoteName];
    if (!entryUrl) {
      this.telemetry.warn('remote.info.missing', { remoteName });
      this.setRemoteStatus(remoteName, { status: 'error', error: 'not_registered' });
      return;
    }

    const baseUrl = getRemoteBaseUrl(entryUrl);
    const infoUrl = `${baseUrl}${REMOTE_INFO_PATH}`;

    try {
      const response = await this.fetchWithResilience(
        `remote-info:${remoteName}`,
        infoUrl,
        { cache: 'no-store' },
        this.remoteInfoTimeoutMs
      );
      if (!response.ok) {
        this.telemetry.warn('remote.info.fetch.failed', {
          remoteName,
          status: response.status,
          durationMs: Date.now() - startedAt
        });
        this.setRemoteStatus(remoteName, { url: baseUrl, error: `metadata_${response.status}` });
        return;
      }

      const data = await response.json();
      const normalized = normalizeRemoteInfoPayload(data);
      if (!normalized) {
        this.telemetry.warn('remote.info.schema.invalid', {
          remoteName,
          durationMs: Date.now() - startedAt
        });
        this.setRemoteStatus(remoteName, { url: baseUrl, error: 'metadata_invalid' });
        return;
      }

      const patch: Partial<RemoteStatusEntry> = {
        angular: normalized.angular,
        libs: normalized.libs,
        stats: normalized.stats,
        url: baseUrl,
        updatedAt: new Date().toISOString(),
        error: undefined
      };
      if (normalized.label) {
        patch.label = normalized.label;
      }
      this.setRemoteStatus(remoteName, patch);
      this.telemetry.timing('remote.info.fetch', Date.now() - startedAt, { remoteName });
    } catch (error) {
      this.telemetry.warn('remote.info.fetch.error', {
        remoteName,
        error,
        durationMs: Date.now() - startedAt
      });
      this.setRemoteStatus(remoteName, { url: baseUrl, error: 'metadata_error' });
    }
  }

  private async fetchWebComponentInfo(component: WebComponentConfig) {
    const startedAt = Date.now();
    const infoUrl = new URL(REMOTE_INFO_PATH, component.baseUrl).toString();

    try {
      const response = await this.fetchWithResilience(
        `webcomponent-info:${component.name}`,
        infoUrl,
        { cache: 'no-store' },
        this.remoteInfoTimeoutMs
      );
      if (!response.ok) {
        this.telemetry.warn('webcomponent.info.fetch.failed', {
          name: component.name,
          status: response.status,
          durationMs: Date.now() - startedAt
        });
        this.setRemoteStatus(component.name, {
          url: component.baseUrl,
          error: `metadata_${response.status}`
        });
        return;
      }

      const data = await response.json();
      const normalized = normalizeRemoteInfoPayload(data);
      if (!normalized) {
        this.telemetry.warn('webcomponent.info.schema.invalid', {
          name: component.name,
          durationMs: Date.now() - startedAt
        });
        this.setRemoteStatus(component.name, {
          url: component.baseUrl,
          error: 'metadata_invalid'
        });
        return;
      }

      this.setRemoteStatus(component.name, {
        label: normalized.label ?? component.label,
        angular: normalized.angular,
        libs: normalized.libs,
        stats: normalized.stats,
        url: component.baseUrl,
        status: 'ready',
        updatedAt: new Date().toISOString(),
        error: undefined
      });
      this.telemetry.timing('webcomponent.info.fetch', Date.now() - startedAt, {
        name: component.name
      });
    } catch (error) {
      this.telemetry.warn('webcomponent.info.fetch.error', {
        name: component.name,
        error,
        durationMs: Date.now() - startedAt
      });
      this.setRemoteStatus(component.name, { url: component.baseUrl, error: 'metadata_error' });
    }
  }

  private async getManifest() {
    if (this.cachedManifest) {
      return this.cachedManifest;
    }

    if (!this.manifestPromise) {
      this.manifestPromise = this.fetchManifest()
        .then((manifest) => {
          this.cachedManifest = manifest;
          return manifest;
        })
        .finally(() => {
          this.manifestPromise = null;
        });
    }

    return this.manifestPromise;
  }

  private startRemoteLoading(meta: RemoteRouteMeta) {
    if (this.remoteLoadingTimer) {
      clearTimeout(this.remoteLoadingTimer);
      this.remoteLoadingTimer = null;
    }
    this.remoteLoadingStartedAt = Date.now();
    this.remoteLoadingLabel.set(meta.label);
    this.remoteLoadingIcon.set(meta.icon);
    this.remoteLoadingAccent.set(meta.accent || 'var(--shell-primary)');
    this.remoteLoading.set(true);
    this.scheduleRemoteLoadingFailsafe();
  }

  private stopRemoteLoading() {
    this.clearRemoteLoadingFailsafe();
    if (!this.remoteLoading()) {
      return;
    }

    const elapsed = Date.now() - this.remoteLoadingStartedAt;
    const remaining = Math.max(0, this.remoteLoadingMinMs - elapsed);

    if (remaining === 0) {
      this.remoteLoading.set(false);
      return;
    }

    if (this.remoteLoadingTimer) {
      clearTimeout(this.remoteLoadingTimer);
    }

    this.remoteLoadingTimer = setTimeout(() => {
      this.remoteLoading.set(false);
      this.remoteLoadingTimer = null;
    }, remaining);
  }

  private scheduleRemoteLoadingFailsafe() {
    this.clearRemoteLoadingFailsafe();

    this.remoteLoadingFailsafeTimer = setTimeout(() => {
      if (!this.remoteLoading()) {
        this.remoteLoadingFailsafeTimer = null;
        return;
      }
      this.telemetry.warn('remote.loading.timeout', { timeoutMs: this.remoteLoadingMaxMs });
      this.remoteLoading.set(false);
      this.remoteLoadingFailsafeTimer = null;
    }, this.remoteLoadingMaxMs);
  }

  private clearRemoteLoadingFailsafe() {
    if (!this.remoteLoadingFailsafeTimer) {
      return;
    }
    clearTimeout(this.remoteLoadingFailsafeTimer);
    this.remoteLoadingFailsafeTimer = null;
  }

  setTheme(theme: ShellTheme) {
    this.activeTheme = theme;
    const root = document.documentElement;
    this.themes.forEach(themeClass => root.classList.remove(themeClass));
    root.classList.add(theme);
  }

  currentThemeIcon() {
    return this.themeOptions.find((option) => option.id === this.activeTheme)?.icon ?? 'palette';
  }

  toggleThemeMenu(event: Event) {
    event.stopPropagation();
    this.isThemeMenuOpen.set(!this.isThemeMenuOpen());
  }

  closeTopbarMenus() {
    this.isThemeMenuOpen.set(false);
  }

  captureTopbarMenus(event: Event) {
    event.stopPropagation();
  }

  selectTheme(theme: string) {
    if (!this.themes.includes(theme as ShellTheme)) {
      return;
    }

    this.setTheme(theme as ShellTheme);
    this.isThemeMenuOpen.set(false);
  }

  async loadRemoteMenus(force = false) {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.menuLoading()) {
      return;
    }

    const remotesToLoad = force
      ? REMOTE_MENU_CONFIG
      : REMOTE_MENU_CONFIG.filter((remote) => !this.loadedMenuSources.has(remote.name));
    const componentsToLoad = force
      ? WEB_COMPONENT_MENU_CONFIG
      : WEB_COMPONENT_MENU_CONFIG.filter(
        (component) => !this.loadedMenuSources.has(component.name)
      );

    if (!remotesToLoad.length && !componentsToLoad.length) {
      return;
    }

    this.menuLoading.set(true);
    this.menuError.set(null);

    try {
      let manifest: Record<string, string> | null = null;
      let manifestError: unknown = null;
      if (remotesToLoad.length) {
        try {
          manifest = await this.getManifest();
        } catch (error) {
          manifestError = error;
        }
      }
      const remoteResults = remotesToLoad.length
        ? await Promise.allSettled(
          remotesToLoad.map((remote) =>
            manifest
              ? this.fetchRemoteMenu(remote, manifest)
              : Promise.reject(
                manifestError ?? new Error('Manifesto de federacao indisponivel.')
              )
          )
        )
        : [];
      const componentResults = componentsToLoad.length
        ? await Promise.allSettled(
          componentsToLoad.map((component) => this.fetchWebComponentMenu(component))
        )
        : [];

      const updatedMenus = { ...this.remoteMenus() };
      const failed: string[] = [];

      remoteResults.forEach((result, index) => {
        const remote = remotesToLoad[index];
        if (result.status === 'fulfilled') {
          updatedMenus[remote.name] = result.value;
          this.loadedMenuSources.add(remote.name);
        } else {
          failed.push(remote.name);
        }
      });

      componentResults.forEach((result, index) => {
        const component = componentsToLoad[index];
        if (result.status === 'fulfilled') {
          updatedMenus[component.name] = result.value;
          this.loadedMenuSources.add(component.name);
        } else {
          failed.push(component.name);
        }
      });

      this.remoteMenus.set(updatedMenus);

      if (failed.length) {
        this.menuError.set(`Apps indisponiveis: ${failed.join(', ')}`);
      }
    } catch (error) {
      this.menuError.set('Apps indisponiveis no momento.');
    } finally {
      this.menuLoading.set(false);
    }
  }

  private async fetchManifest(): Promise<Record<string, string>> {
    const startedAt = Date.now();
    const config = await loadRuntimeConfig();
    try {
      const response = await this.fetchWithResilience(
        'manifest',
        config.manifestUrl,
        { cache: 'no-store' },
        this.manifestTimeoutMs
      );
      if (!response.ok) {
        this.telemetry.warn('remote.manifest.fetch.failed', {
          status: response.status,
          durationMs: Date.now() - startedAt
        });
        throw new Error('Manifesto de federacao indisponivel.');
      }
      const data = await response.json();
      this.telemetry.timing('remote.manifest.fetch', Date.now() - startedAt, {
        status: response.status
      });
      return data;
    } catch (error) {
      this.telemetry.error('remote.manifest.fetch.error', {
        error,
        durationMs: Date.now() - startedAt
      });
      throw error;
    }
  }

  private async fetchRemoteMenu(
    remote: RemoteMenuConfig,
    manifest: Record<string, string>
  ): Promise<MenuGroup> {
    const startedAt = Date.now();
    const entryUrl = manifest[remote.name];
    if (!entryUrl) {
      this.telemetry.warn('remote.menu.missing', { remoteName: remote.name });
      throw new Error(`Remote nao registrado: ${remote.name}`);
    }

    const baseUrl = getRemoteBaseUrl(entryUrl);
    const menuUrl = `${baseUrl}${remote.menuPath}`;

    try {
      const response = await this.fetchWithResilience(
        `menu:${remote.name}`,
        menuUrl,
        { cache: 'no-store' },
        this.remoteMenuTimeoutMs
      );
      if (!response.ok) {
        this.telemetry.warn('remote.menu.fetch.failed', {
          remoteName: remote.name,
          status: response.status,
          durationMs: Date.now() - startedAt
        });
        throw new Error(`Menu indisponivel: ${remote.name}`);
      }

      const data = await response.json();
      const normalized = normalizeMenuPayload(data, {
        id: remote.name,
        label: remote.name
      });
      if (!normalized) {
        this.telemetry.warn('remote.menu.schema.invalid', { remoteName: remote.name });
        throw new Error(`Menu payload invalido: ${remote.name}`);
      }
      this.telemetry.timing('remote.menu.fetch', Date.now() - startedAt, {
        remoteName: remote.name,
        itemCount: normalized.items.length
      });
      return normalized;
    } catch (error) {
      this.telemetry.error('remote.menu.fetch.error', {
        remoteName: remote.name,
        error,
        durationMs: Date.now() - startedAt
      });
      throw error;
    }
  }

  private async fetchWebComponentMenu(component: WebComponentMenuConfig): Promise<MenuGroup> {
    const startedAt = Date.now();
    const menuUrl = new URL(component.menuPath, component.baseUrl).toString();

    try {
      const response = await this.fetchWithResilience(
        `webcomponent-menu:${component.name}`,
        menuUrl,
        { cache: 'no-store' },
        this.remoteMenuTimeoutMs
      );
      if (!response.ok) {
        this.telemetry.warn('webcomponent.menu.fetch.failed', {
          remoteName: component.name,
          status: response.status,
          durationMs: Date.now() - startedAt
        });
        throw new Error(`Menu indisponivel: ${component.name}`);
      }

      const data = await response.json();
      const normalized = normalizeMenuPayload(data, {
        id: component.routeSegment,
        label: component.label
      });
      if (!normalized) {
        this.telemetry.warn('webcomponent.menu.schema.invalid', { remoteName: component.name });
        throw new Error(`Menu payload invalido: ${component.name}`);
      }
      this.telemetry.timing('webcomponent.menu.fetch', Date.now() - startedAt, {
        remoteName: component.name,
        itemCount: normalized.items.length
      });
      return normalized;
    } catch (error) {
      this.telemetry.error('webcomponent.menu.fetch.error', {
        remoteName: component.name,
        error,
        durationMs: Date.now() - startedAt
      });
      throw error;
    }
  }

  private async fetchWithResilience(
    breakerKey: string,
    input: RequestInfo | URL,
    init: RequestInit,
    timeoutMs: number,
    retryOptions?: RetryOptions
  ): Promise<Response> {
    const options = retryOptions ?? this.fetchRetryOptions;
    const breaker = remoteFetchBreakers.get(breakerKey, this.fetchBreakerOptions);

    return breaker.exec(() =>
      withRetry(() => fetchWithTimeout(input, init, timeoutMs), options)
    );
  }
}
