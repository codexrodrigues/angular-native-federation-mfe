import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';
import { ModuleUnavailableComponent } from './module-unavailable/module-unavailable.component';
import {
  CircuitBreakerOptions,
  RetryOptions,
  remoteModuleBreakers,
  withRetry,
  withTimeout
} from './resilience/remote-resilience';

const isServer = typeof window === 'undefined';
const MODULE_UNAVAILABLE_ROUTES: Routes = [{ path: '', component: ModuleUnavailableComponent }];
const REMOTE_ROUTE_TIMEOUT_MS = 8000;

const REMOTE_ROUTE_RETRY_OPTIONS: RetryOptions = {
  retries: 2,
  baseDelayMs: 300,
  maxDelayMs: 1600,
  jitterMs: 120
};

const REMOTE_ROUTE_BREAKER_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 2,
  successThreshold: 1,
  openMs: 15000
};

const resolveRoutes = (remoteModule: unknown, exportName: string): Routes => {
  if (Array.isArray(remoteModule)) {
    return remoteModule as Routes;
  }

  if (remoteModule && typeof remoteModule === 'object') {
    const exported = (remoteModule as Record<string, unknown>)[exportName];
    if (Array.isArray(exported)) {
      return exported as Routes;
    }
  }

  return MODULE_UNAVAILABLE_ROUTES;
};

const loadRemoteRoutes = async (options: {
  remoteName: string;
  exposedModule: string;
  exportName: string;
  fallback: Promise<Routes>;
  timeoutMs?: number;
}): Promise<Routes> => {
  const { remoteName, exposedModule, exportName, fallback, timeoutMs } = options;

  try {
    const breaker = remoteModuleBreakers.get(remoteName, REMOTE_ROUTE_BREAKER_OPTIONS);
    const remoteModule = await breaker.exec(() =>
      withRetry(
        () =>
          withTimeout(
            loadRemoteModule({
              remoteName,
              exposedModule
            }),
            timeoutMs ?? REMOTE_ROUTE_TIMEOUT_MS,
            remoteName
          ),
        REMOTE_ROUTE_RETRY_OPTIONS
      )
    );

    return resolveRoutes(remoteModule, exportName);
  } catch (error) {
    console.error(`[${remoteName}] Falha ao carregar rotas.`, error);
    try {
      return await fallback;
    } catch (fallbackError) {
      console.error(`[${remoteName}] Fallback local indisponivel.`, fallbackError);
      return MODULE_UNAVAILABLE_ROUTES;
    }
  }
};

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home'
  },
  {
    path: 'home',
    loadComponent: () => import('./app.component').then(m => m.HomeComponent)
  },
  {
    path: 'credito/analise',
    loadComponent: () =>
      import('./credito-element/credito-element-page.component')
        .then(m => m.CreditoElementPageComponent),
    data: {
      creditoView: 'analise'
    }
  },
  {
    path: 'credito/painel',
    loadComponent: () =>
      import('./credito-element/credito-element-page.component')
        .then(m => m.CreditoElementPageComponent),
    data: {
      creditoView: 'painel'
    }
  },
  {
    path: 'credito',
    pathMatch: 'full',
    loadComponent: () =>
      import('./credito-element/credito-element-page.component')
        .then(m => m.CreditoElementPageComponent),
    data: {
      creditoView: 'simulacao'
    }
  },
  {
    path: 'sales',
    loadChildren: () => {
      const fallback = import('./sales-shell.routes').then((m) => m.SALES_SHELL_ROUTES);

      return isServer
        ? fallback
        : loadRemoteRoutes({
          remoteName: 'remote-sales',
          exposedModule: './Routes',
          exportName: 'SALES_ROUTES',
          fallback
        });
    }
  },
  {
    path: 'gde',
    loadChildren: () => {
      const fallback = import('./gde-shell.routes').then((m) => m.GDE_SHELL_ROUTES);

      return isServer
        ? fallback
        : loadRemoteRoutes({
          remoteName: 'remote-gde',
          exposedModule: './Routes',
          exportName: 'GDE_ROUTES',
          fallback
        });
    }
  },
  {
    path: 'conta-corrente',
    loadChildren: () => {
      const fallback = import('./accounts-shell.routes').then((m) => m.ACCOUNTS_SHELL_ROUTES);

      return isServer
        ? fallback
        : loadRemoteRoutes({
          remoteName: 'remote-accounts',
          exposedModule: './Routes',
          exportName: 'ACCOUNTS_ROUTES',
          fallback
        });
    }
  }
];
