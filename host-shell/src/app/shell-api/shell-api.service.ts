import { Injectable, inject } from '@angular/core';
import { loadRemoteModule } from '@angular-architects/native-federation';
import {
  DrawerIntent,
  DrawerOutcome,
  ShellApi,
  isContractDrawerIntent,
  isContractDrawerResult,
  toDrawerIntentKey
} from 'shared-logic/core';
import {
  CircuitBreakerOptions,
  RetryOptions,
  remoteModuleBreakers,
  withRetry,
  withTimeout
} from '../resilience/remote-resilience';
import { HostDrawerService } from '../drawer/host-drawer.service';
import { TelemetryService } from '../telemetry/telemetry.service';
import { DRAWER_REGISTRY, DrawerRegistryEntry, resolveDrawerEntry } from './drawer-registry';

type RemoteModule = Record<string, unknown>;

const DRAWER_REMOTE_RETRY_OPTIONS: RetryOptions = {
  retries: 2,
  baseDelayMs: 300,
  maxDelayMs: 1600,
  jitterMs: 120
};

const DRAWER_REMOTE_BREAKER_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 2,
  successThreshold: 1,
  openMs: 15000
};

@Injectable({ providedIn: 'root' })
export class ShellApiService implements ShellApi {
  private readonly drawerService = inject(HostDrawerService);
  private readonly telemetry = inject(TelemetryService);
  private readonly moduleCache = new Map<string, Promise<RemoteModule>>();
  private readonly remoteLoadTimeoutMs = 8000;

  capabilities() {
    const supported: Record<string, Set<string>> = {};
    for (const entry of Object.values(DRAWER_REGISTRY)) {
      const [kind, version] = entry.key.split('@');
      if (!supported[kind]) {
        supported[kind] = new Set();
      }
      supported[kind].add(version);
    }

    return {
      supportedIntents: Object.entries(supported).map(([kind, versions]) => ({
        kind,
        versions: Array.from(versions)
      }))
    };
  }

  async openDrawer(intent: DrawerIntent): Promise<DrawerOutcome | undefined> {
    const key = toDrawerIntentKey(intent.kind, intent.version);
    const entry = resolveDrawerEntry(key);
    const correlationId = intent?.correlationId ?? 'unknown';

    if (!entry) {
      this.telemetry.warn('drawer.intent.unsupported', {
        key,
        correlationId
      });
      return undefined;
    }

    if (!isContractDrawerIntent(intent)) {
      this.telemetry.warn('drawer.intent.invalid', { key, correlationId, intent });
      return undefined;
    }

    this.telemetry.info('drawer.open.requested', {
      key,
      correlationId,
      remoteName: entry.remoteName,
      exposedModule: entry.exposedModule
    });

    const ref = this.drawerService.openLoading({
      title: entry.title,
      subtitle: entry.subtitle,
      sectionTitle: entry.sectionTitle,
      size: entry.size,
      data: intent.data,
      loadingLabel: entry.loadingLabel
    });
    const openedAt = Date.now();

    let active = true;
    ref.afterClosed.then(() => {
      active = false;
    });

    const loadStartedAt = Date.now();
    void this.loadComponent(entry)
      .then((component) => {
        this.telemetry.timing('drawer.remote.load', Date.now() - loadStartedAt, {
          key,
          correlationId,
          remoteName: entry.remoteName,
          exposedModule: entry.exposedModule
        });
        if (active) {
          this.drawerService.setDrawerContent(component, intent.data);
        }
      })
      .catch((error) => {
        this.telemetry.error('drawer.load.failed', {
          key,
          correlationId,
          error,
          durationMs: Date.now() - loadStartedAt
        });
        if (active) {
          this.drawerService.setDrawerError(entry.errorLabel ?? 'Falha ao carregar o modulo remoto.');
        }
      });

    const result = await ref.afterClosed;
    this.telemetry.timing('drawer.open.duration', Date.now() - openedAt, {
      key,
      correlationId,
      action: result ? (result as { action?: string }).action ?? 'closed' : 'closed'
    });
    if (!result) {
      return undefined;
    }

    if (!isContractDrawerResult(result)) {
      this.telemetry.warn('drawer.result.invalid', {
        key,
        correlationId,
        result
      });
      return undefined;
    }

    return result;
  }

  private async loadComponent(entry: DrawerRegistryEntry): Promise<unknown> {
    const cacheKey = `${entry.remoteName}:${entry.exposedModule}`;
    const loadPromise =
      this.moduleCache.get(cacheKey) ?? this.createModuleLoader(cacheKey, entry);

    const remoteModule = await loadPromise;
    const component = remoteModule?.[entry.exportName];
    if (!component) {
      throw new Error(`Export nao encontrado: ${entry.exportName}`);
    }
    return component;
  }

  private createModuleLoader(cacheKey: string, entry: DrawerRegistryEntry): Promise<RemoteModule> {
    const breaker = remoteModuleBreakers.get(entry.remoteName, DRAWER_REMOTE_BREAKER_OPTIONS);
    const loader = breaker.exec(() =>
      withRetry(
        () =>
          withTimeout(
            loadRemoteModule({
              remoteName: entry.remoteName,
              exposedModule: entry.exposedModule
            }),
            this.remoteLoadTimeoutMs,
            entry.remoteName
          ),
        DRAWER_REMOTE_RETRY_OPTIONS
      )
    ).catch((error) => {
      this.moduleCache.delete(cacheKey);
      throw error;
    }) as Promise<RemoteModule>;

    this.moduleCache.set(cacheKey, loader);
    return loader;
  }
}
