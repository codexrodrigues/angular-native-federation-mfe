import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  signal,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WebComponentLoaderService } from '../web-components/web-component-loader.service';
import { getWebComponentByName } from '../web-components/web-component-config';
import {
  CircuitBreakerOptions,
  RetryOptions,
  fetchWithTimeout,
  remoteFetchBreakers,
  withRetry
} from '../resilience/remote-resilience';
import { ShellApiService } from '../shell-api/shell-api.service';
import { TelemetryService } from '../telemetry/telemetry.service';
import { ToastService } from '../toast/toast.service';

const REMOTE_CREDITO_ELEMENT = 'remote-credito';
const HANDSHAKE_TIMEOUT_MS = 4500;
const HANDSHAKE_RETRY_OPTIONS: RetryOptions = {
  retries: 2,
  baseDelayMs: 350,
  maxDelayMs: 2000,
  jitterMs: 150
};
const HANDSHAKE_BREAKER_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 2,
  successThreshold: 1,
  openMs: 15000
};
const resolveRemoteCreditoBaseUrl = (): string => {
  const component = getWebComponentByName(REMOTE_CREDITO_ELEMENT);
  if (!component?.baseUrl) {
    throw new Error(`[host-shell] Missing baseUrl for ${REMOTE_CREDITO_ELEMENT}`);
  }
  return component.baseUrl;
};

type ShellApiBridge = {
  openDrawer: (intent: unknown) => Promise<unknown>;
  capabilities: () => { supportedIntents: Array<{ kind: string; versions: string[] }> };
  navigate: (path: string) => Promise<boolean>;
  track: (event: ShellTelemetryEvent) => void;
  toast: (payload: ShellToastPayload) => void;
};

type ShellContext = {
  userId: string;
  locale: string;
  theme: string;
  route: string;
  updatedAt?: string;
};

type ShellTelemetryEvent = {
  name: string;
  level?: 'info' | 'warn' | 'error';
  data?: Record<string, unknown>;
  durationMs?: number;
};

type ShellToastPayload = {
  message: string;
  title?: string;
  level?: 'info' | 'success' | 'warning' | 'error';
  durationMs?: number;
};

type RemoteIntegrationInfo = {
  protocol?: string;
  version?: string;
  requiredShellCapabilities?: string[];
};

type RemoteElementInfo = {
  name?: string;
  entry?: string;
  style?: string;
};

type RemoteHandshakeInfo = {
  protocol: string;
  version: string;
  requiredShellCapabilities: string[];
  elementName: string;
  entry: string;
  style?: string;
};

@Component({
  selector: 'app-credito-element-page',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <section class="credito-host">
      <header class="credito-host__header">
        <h1>Credito (Angular 19)</h1>
        <p>POC de Web Component carregado no shell Angular 20.</p>
      </header>

      @if (state() === 'ready') {
        <remote-credito #creditoEl [attr.userId]="userId" [attr.view]="view"></remote-credito>
      } @else if (state() === 'error') {
        <div class="credito-host__status credito-host__status--error">
          {{ errorMessage() || 'Falha ao carregar o widget remoto.' }}
        </div>
      } @else {
        <div class="credito-host__status">Carregando widget remoto...</div>
      }
    </section>
  `,
  styles: [
    `
      .credito-host {
        display: grid;
        gap: 16px;
        padding: 24px;
      }

      .credito-host__header h1 {
        margin: 0 0 4px;
        font-size: 24px;
      }

      .credito-host__header p {
        margin: 0;
        color: var(--color-surface-text-default-medium, #51606a);
      }

      .credito-host__status {
        padding: 16px;
        border-radius: 12px;
        border: 1px dashed var(--color-surface-stroke-medium, #d5dae2);
        background: var(--color-surface-background-low, #ffffff);
        color: var(--color-surface-text-default-medium, #51606a);
      }

      .credito-host__status--error {
        border-color: var(--color-denotative-error-default, #f7406c);
        color: var(--color-denotative-error-default, #f7406c);
      }
    `
  ]
})
export class CreditoElementPageComponent implements OnInit, OnDestroy {
  @ViewChild('creditoEl', { read: ElementRef })
  set creditoElementRef(value: ElementRef<HTMLElement> | undefined) {
    const element = value?.nativeElement;
    if (element === this.creditoEl) {
      return;
    }

    this.teardownElement();
    this.creditoEl = element;
    if (!element) {
      return;
    }

    this.attachShellApi(element);
    this.applyShellContext(element);
    this.bindEvents(element);
  }

  readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  readonly errorMessage = signal<string | null>(null);
  view = 'simulacao';
  userId = 'USR-0042';

  private eventHandler?: (event: Event) => void;
  private themeObserver?: MutationObserver;
  private creditoEl?: HTMLElement;
  private readonly bridgeProtocol = 'shell-bridge';
  private readonly bridgeVersion = '1.0.0';
  private readonly supportedShellCapabilities = new Set([
    'openDrawer',
    'navigate',
    'track',
    'toast',
    'capabilities'
  ]);
  private readonly shellApi = inject(ShellApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly telemetry = inject(TelemetryService);
  private readonly toastService = inject(ToastService);

  constructor(private readonly loader: WebComponentLoaderService) {}

  async ngOnInit(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    this.view = this.resolveView(this.route.snapshot.data['creditoView']);

    try {
      const baseUrl = resolveRemoteCreditoBaseUrl();
      this.errorMessage.set(null);

      const handshake = await this.verifyHandshake(baseUrl);
      const scriptUrl = new URL(handshake.entry, baseUrl).toString();
      const styleUrl = new URL(handshake.style ?? 'styles.css', baseUrl).toString();

      await this.loader.loadResources({ scriptUrl, styleUrl });
      await customElements.whenDefined(REMOTE_CREDITO_ELEMENT);

      this.state.set('ready');
      this.startThemeSync();
    } catch (error) {
      console.error('[host-shell] Failed to load remote-credito element', error);
      if (!this.errorMessage()) {
        this.errorMessage.set('Falha ao carregar o widget remoto.');
      }
      this.state.set('error');
    }
  }

  ngOnDestroy(): void {
    this.teardownElement();
    if (this.themeObserver) {
      this.themeObserver.disconnect();
      this.themeObserver = undefined;
    }
  }

  private bindEvents(element: HTMLElement): void {
    this.eventHandler = (event: Event) => {
      const detail = (event as CustomEvent).detail as { action?: string; payload?: unknown } | undefined;
      if (!detail?.action) {
        return;
      }

      if (detail.action === 'open-contract-drawer' && detail.payload) {
        void this.shellApi.openDrawer(detail.payload as never);
        return;
      }

      if (detail.action === 'navigate' && detail.payload) {
        const path = (detail.payload as { path?: string }).path;
        if (path) {
          void this.router.navigateByUrl(path);
        }
        return;
      }

      if (detail.action === 'telemetry' && detail.payload) {
        this.emitTelemetry(detail.payload as ShellTelemetryEvent);
        return;
      }

      if (detail.action === 'toast' && detail.payload) {
        this.showToast(detail.payload as ShellToastPayload);
        return;
      }

      console.log('[host-shell] remote-credito event', detail);
    };

    element.addEventListener('creditoAction', this.eventHandler);
  }

  private attachShellApi(element: HTMLElement): void {
    const target = element as HTMLElement & { shellApi?: ShellApiBridge };
    if (!target) {
      return;
    }

    target.shellApi = {
      openDrawer: (intent: unknown) => this.shellApi.openDrawer(intent as never),
      capabilities: () => this.shellApi.capabilities(),
      navigate: async (path: string) => {
        if (!path) {
          return false;
        }
        return this.router.navigateByUrl(path);
      },
      track: (event: ShellTelemetryEvent) => {
        this.emitTelemetry(event);
      },
      toast: (payload: ShellToastPayload) => {
        this.showToast(payload);
      }
    };
  }

  private applyShellContext(element?: HTMLElement): void {
    const target = (element ?? this.creditoEl) as
      | (HTMLElement & { shellContext?: ShellContext })
      | undefined;
    if (!target) {
      return;
    }

    const locale =
      typeof document !== 'undefined' && document.documentElement.lang
        ? document.documentElement.lang
        : 'pt-BR';

    target.shellContext = {
      userId: this.userId,
      locale,
      theme: this.resolveTheme(),
      route: typeof window !== 'undefined' ? window.location.pathname : '/credito',
      updatedAt: new Date().toISOString()
    };
  }

  private startThemeSync(): void {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
      return;
    }

    const root = document.documentElement;
    this.themeObserver = new MutationObserver(() => this.applyShellContext());
    this.themeObserver.observe(root, { attributes: true, attributeFilter: ['class'] });
  }

  private resolveTheme(): string {
    if (typeof document === 'undefined') {
      return 'aurora-light';
    }

    const root = document.documentElement;
    const themes = ['aurora-light', 'aurora-dark', 'marinho-light', 'citrico-light'];
    return themes.find((theme) => root.classList.contains(theme)) ?? 'aurora-light';
  }

  private resolveView(value: unknown): string {
    if (typeof value !== 'string') {
      return 'simulacao';
    }

    switch (value.trim().toLowerCase()) {
      case 'analise':
        return 'analise';
      case 'painel':
        return 'painel';
      default:
        return 'simulacao';
    }
  }

  private async verifyHandshake(baseUrl: string): Promise<RemoteHandshakeInfo> {
    if (typeof window === 'undefined') {
      return {
        protocol: this.bridgeProtocol,
        version: this.bridgeVersion,
        requiredShellCapabilities: [],
        elementName: REMOTE_CREDITO_ELEMENT,
        entry: 'main.js',
        style: 'styles.css'
      };
    }

    const startedAt = Date.now();
    const infoUrl = new URL('remote-info.json', baseUrl).toString();

    try {
      const breaker = remoteFetchBreakers.get(
        `webcomponent-handshake:${REMOTE_CREDITO_ELEMENT}`,
        HANDSHAKE_BREAKER_OPTIONS
      );
      const response = await breaker.exec(() =>
        withRetry(
          () => fetchWithTimeout(infoUrl, { cache: 'no-store' }, HANDSHAKE_TIMEOUT_MS),
          HANDSHAKE_RETRY_OPTIONS
        )
      );
      if (!response.ok) {
        this.reportHandshakeFailure('fetch_failed', { status: response.status, baseUrl });
        throw new Error(`metadata_${response.status}`);
      }

      const payload = (await response.json()) as unknown;
      const info = this.parseHandshakeInfo(payload);
      if (!info) {
        this.reportHandshakeFailure('schema_invalid', { baseUrl });
        throw new Error('metadata_invalid');
      }

      const validationError = this.validateHandshake(info);
      if (validationError) {
        this.reportHandshakeFailure('incompatible', {
          baseUrl,
          reason: validationError
        });
        this.errorMessage.set(validationError);
        throw new Error('handshake_incompatible');
      }

      this.telemetry.timing('webcomponent.handshake.fetch', Date.now() - startedAt, {
        name: REMOTE_CREDITO_ELEMENT
      });

      return info;
    } catch (error) {
      this.telemetry.warn('webcomponent.handshake.error', {
        name: REMOTE_CREDITO_ELEMENT,
        error,
        durationMs: Date.now() - startedAt
      });
      throw error;
    }
  }

  private parseHandshakeInfo(raw: unknown): RemoteHandshakeInfo | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const payload = raw as Record<string, unknown>;
    const integration = payload['integration'] as RemoteIntegrationInfo | undefined;
    const element = payload['element'] as RemoteElementInfo | undefined;

    if (!integration || !element) {
      return null;
    }

    const protocol = typeof integration.protocol === 'string' ? integration.protocol : '';
    const version = typeof integration.version === 'string' ? integration.version : '';
    const requiredShellCapabilities = Array.isArray(integration.requiredShellCapabilities)
      ? integration.requiredShellCapabilities.filter((cap): cap is string => typeof cap === 'string')
      : [];
    const elementName = typeof element.name === 'string' ? element.name : '';
    const entry = typeof element.entry === 'string' ? element.entry : '';
    const style = typeof element.style === 'string' ? element.style : undefined;

    if (!protocol || !version || !elementName || !entry) {
      return null;
    }

    return {
      protocol,
      version,
      requiredShellCapabilities,
      elementName,
      entry,
      style
    };
  }

  private validateHandshake(info: RemoteHandshakeInfo): string | null {
    if (info.protocol !== this.bridgeProtocol) {
      return `Protocolo de integracao incompativel: ${info.protocol}`;
    }

    if (!this.isCompatibleVersion(info.version)) {
      return `Versao do bridge incompativel: ${info.version}`;
    }

    if (info.elementName !== REMOTE_CREDITO_ELEMENT) {
      return `Elemento inesperado: ${info.elementName}`;
    }

    const missing = info.requiredShellCapabilities.filter(
      (capability) => !this.supportedShellCapabilities.has(capability)
    );
    if (missing.length) {
      return `Shell nao suporta: ${missing.join(', ')}`;
    }

    return null;
  }

  private isCompatibleVersion(version: string): boolean {
    const remoteMajor = this.parseMajorVersion(version);
    const supportedMajor = this.parseMajorVersion(this.bridgeVersion);
    return remoteMajor !== null && supportedMajor !== null && remoteMajor === supportedMajor;
  }

  private parseMajorVersion(version: string): number | null {
    const match = version.trim().match(/^(\d+)(?:\.\d+){0,2}$/);
    if (!match) {
      return null;
    }
    const parsed = Number(match[1]);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private reportHandshakeFailure(reason: string, data?: Record<string, unknown>): void {
    const messages: Record<string, string> = {
      fetch_failed: 'Nao foi possivel validar o remote-info.json.',
      schema_invalid: 'remote-info.json invalido.',
      incompatible: 'Integracao do widget remoto incompativel.'
    };
    this.telemetry.warn('webcomponent.handshake.failed', {
      name: REMOTE_CREDITO_ELEMENT,
      reason,
      ...data
    });
    if (!this.errorMessage()) {
      this.errorMessage.set(messages[reason] ?? 'Integracao do widget remoto incompativel.');
    }
  }

  private teardownElement(): void {
    if (this.creditoEl && this.eventHandler) {
      this.creditoEl.removeEventListener('creditoAction', this.eventHandler);
    }
    this.eventHandler = undefined;
    this.creditoEl = undefined;
  }

  private emitTelemetry(event: ShellTelemetryEvent): void {
    if (!event?.name) {
      return;
    }

    if (typeof event.durationMs === 'number' && Number.isFinite(event.durationMs)) {
      this.telemetry.timing(event.name, event.durationMs, event.data);
      return;
    }

    switch (event.level) {
      case 'warn':
        this.telemetry.warn(event.name, event.data);
        return;
      case 'error':
        this.telemetry.error(event.name, event.data);
        return;
      default:
        this.telemetry.info(event.name, event.data);
    }
  }

  private showToast(payload: ShellToastPayload): void {
    if (!payload?.message) {
      return;
    }

    this.toastService.show({
      message: payload.message,
      title: payload.title,
      level: payload.level ?? 'info',
      durationMs: payload.durationMs
    });
  }
}
