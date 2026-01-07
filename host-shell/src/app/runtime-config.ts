export type RuntimeConfig = {
  manifestUrl: string;
  telemetryUrl?: string;
  telemetrySampleRate?: number;
  remotes?: Record<string, string>;
  webComponents?: Record<string, WebComponentRuntimeConfig>;
};

export type WebComponentRuntimeConfig = {
  baseUrl: string;
  label?: string;
  routeSegment?: string;
  accent?: string;
  menuPath?: string;
};

const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  manifestUrl: 'federation.manifest.json'
};

const CONFIG_URL = 'config.json';

declare global {
  interface Window {
    __HOST_SHELL_CONFIG__?: RuntimeConfig;
  }
}

let cachedConfig: RuntimeConfig | null = null;
let configPromise: Promise<RuntimeConfig> | null = null;
let inlineManifestCache: { key: string; url: string } | null = null;

const normalizeString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const normalizeBaseUrl = (value: string): string => (value.endsWith('/') ? value : `${value}/`);

const resolveRemotes = (raw: unknown): Record<string, string> | undefined => {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }

  const remotes: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'string') {
      const entry = normalizeString(value);
      if (entry) {
        remotes[key] = entry;
      }
      continue;
    }

    if (value && typeof value === 'object') {
      const entry = normalizeString((value as { entry?: unknown }).entry);
      if (entry) {
        remotes[key] = entry;
      }
    }
  }

  return Object.keys(remotes).length ? remotes : undefined;
};

const resolveWebComponents = (
  raw: unknown
): Record<string, WebComponentRuntimeConfig> | undefined => {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }

  const resolved: Record<string, WebComponentRuntimeConfig> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'string') {
      const baseUrl = normalizeString(value);
      if (baseUrl) {
        resolved[key] = { baseUrl: normalizeBaseUrl(baseUrl) };
      }
      continue;
    }

    if (value && typeof value === 'object') {
      const baseUrl = normalizeString((value as { baseUrl?: unknown }).baseUrl);
      if (baseUrl) {
        const label = normalizeString((value as { label?: unknown }).label);
        const routeSegment = normalizeString((value as { routeSegment?: unknown }).routeSegment);
        const accent = normalizeString((value as { accent?: unknown }).accent);
        const menuPath = normalizeString((value as { menuPath?: unknown }).menuPath);
        resolved[key] = {
          baseUrl: normalizeBaseUrl(baseUrl),
          label,
          routeSegment,
          accent,
          menuPath
        };
      }
    }
  }

  return Object.keys(resolved).length ? resolved : undefined;
};

const resolveConfig = (raw: unknown): RuntimeConfig => {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_RUNTIME_CONFIG;
  }

  const manifestValue = (raw as { manifestUrl?: unknown }).manifestUrl;
  const manifestUrl = normalizeString(manifestValue) ?? DEFAULT_RUNTIME_CONFIG.manifestUrl;

  const telemetryValue = (raw as { telemetryUrl?: unknown }).telemetryUrl;
  const telemetryUrl = normalizeString(telemetryValue);

  const sampleValue = (raw as { telemetrySampleRate?: unknown }).telemetrySampleRate;
  const telemetrySampleRate =
    typeof sampleValue === 'number' && Number.isFinite(sampleValue)
      ? Math.min(1, Math.max(0, sampleValue))
      : undefined;

  const remotes = resolveRemotes((raw as { remotes?: unknown }).remotes);
  const webComponents = resolveWebComponents((raw as { webComponents?: unknown }).webComponents);

  return { manifestUrl, telemetryUrl, telemetrySampleRate, remotes, webComponents };
};

const applyInlineManifest = (config: RuntimeConfig): RuntimeConfig => {
  if (!config.remotes || !Object.keys(config.remotes).length) {
    return config;
  }

  const manifestUrl = createInlineManifestUrl(config.remotes);
  return { ...config, manifestUrl };
};

const createInlineManifestUrl = (remotes: Record<string, string>): string => {
  const manifestJson = JSON.stringify(remotes);
  if (inlineManifestCache?.key === manifestJson) {
    return inlineManifestCache.url;
  }

  const encoded = encodeURIComponent(manifestJson);
  const url = `data:application/json,${encoded}`;
  inlineManifestCache = { key: manifestJson, url };
  return url;
};

const getConfigUrl = (): string => {
  if (typeof document === 'undefined') {
    return CONFIG_URL;
  }

  return new URL(CONFIG_URL, document.baseURI).toString();
};

export const getRuntimeConfig = (): RuntimeConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  if (typeof window !== 'undefined' && window.__HOST_SHELL_CONFIG__) {
    cachedConfig = applyInlineManifest(resolveConfig(window.__HOST_SHELL_CONFIG__));
    return cachedConfig;
  }

  return DEFAULT_RUNTIME_CONFIG;
};

export const loadRuntimeConfig = (): Promise<RuntimeConfig> => {
  if (cachedConfig) {
    return Promise.resolve(cachedConfig);
  }

  if (configPromise) {
    return configPromise;
  }

  if (typeof window === 'undefined') {
    cachedConfig = DEFAULT_RUNTIME_CONFIG;
    return Promise.resolve(cachedConfig);
  }

  if (window.__HOST_SHELL_CONFIG__) {
    cachedConfig = applyInlineManifest(resolveConfig(window.__HOST_SHELL_CONFIG__));
    return Promise.resolve(cachedConfig);
  }

  configPromise = fetch(getConfigUrl(), { cache: 'no-store' })
    .then((response) => (response.ok ? response.json() : null))
    .then((raw) => resolveConfig(raw))
    .catch(() => DEFAULT_RUNTIME_CONFIG)
    .then((config) => {
      const resolved = applyInlineManifest(config);
      cachedConfig = resolved;
      window.__HOST_SHELL_CONFIG__ = resolved;
      return resolved;
    });

  return configPromise;
};
