export abstract class ReportingService {
  abstract print(data: any): void;
}

export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export type DrawerOpenOptions<D = unknown> = {
  title?: string;
  subtitle?: string;
  sectionTitle?: string;
  size?: DrawerSize;
  width?: number;
  data?: D;
  panelClass?: string | string[];
  ariaLabel?: string;
  environmentInjector?: unknown;
};

export abstract class DrawerRef<R = unknown> {
  abstract close(result?: R): void;
  abstract afterClosed: Promise<R | undefined>;
}

export abstract class DrawerService {
  abstract open<T = unknown, D = unknown, R = unknown>(
    component: any,
    options?: DrawerOpenOptions<D>
  ): DrawerRef<R>;
  abstract close(result?: unknown): void;
}

export const CONTRACT_DRAWER_KIND = 'contract-drawer';
export const CONTRACT_DRAWER_VERSION = '1.0';

export type DrawerIntentKey = `${string}@${string}`;

export const toDrawerIntentKey = (kind: string, version: string): DrawerIntentKey =>
  `${kind}@${version}`;

export const CONTRACT_DRAWER_INTENT_KEY = toDrawerIntentKey(
  CONTRACT_DRAWER_KIND,
  CONTRACT_DRAWER_VERSION
);

export type ContractDrawerData = {
  contratoId: string;
  conta: string;
  cooperado: string;
  cooperativa: string;
  agencia: string;
};

export type ContractFormPayload = {
  contratoId: string;
  cooperado: string;
  conta: string;
  cooperativa: string;
  agencia: string;
  modalidade: string;
  limite: number;
  status: string;
  inicioISO: string | null;
  vencimentoISO: string | null;
  observacoes: string;
};

export type ContractDrawerIntent = {
  kind: typeof CONTRACT_DRAWER_KIND;
  version: typeof CONTRACT_DRAWER_VERSION;
  origin: string;
  correlationId: string;
  data: ContractDrawerData;
};

export type ContractDrawerResult =
  | { action: 'cancel' }
  | { action: 'saved'; payload: ContractFormPayload };

export type DrawerIntent = ContractDrawerIntent;
export type DrawerOutcome = ContractDrawerResult;

export type ShellCapabilities = {
  supportedIntents: Array<{ kind: string; versions: string[] }>;
};

export type ShellApi = {
  openDrawer(intent: DrawerIntent): Promise<DrawerOutcome | undefined>;
  capabilities(): ShellCapabilities;
};

export const createShellApiStub = (): ShellApi => ({
  openDrawer: async () => undefined,
  capabilities: () => ({ supportedIntents: [] })
});

export const createCorrelationId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `corr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

const isString = (value: unknown): value is string => typeof value === 'string';
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;
const isIsoString = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value));
const isIsoStringOrNull = (value: unknown): value is string | null =>
  value === null || isIsoString(value);

export type MenuItem = {
  label: string;
  path: string;
  icon?: string;
  order?: number;
  exact?: boolean;
};

export type MenuGroup = {
  id: string;
  label: string;
  order?: number;
  items: MenuItem[];
};

export type MenuGroupDefaults = {
  id: string;
  label: string;
  order?: number;
};

export type RemoteMenuPayload = {
  group?: {
    id?: unknown;
    label?: unknown;
    order?: unknown;
  };
  items?: unknown;
};

export const normalizeMenuItem = (raw: unknown): MenuItem | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const item = raw as Record<string, unknown>;
  const labelValue = typeof item['label'] === 'string' ? item['label'].trim() : '';
  const pathValue = typeof item['path'] === 'string' ? item['path'].trim() : '';

  if (!labelValue || !pathValue) {
    return null;
  }

  const iconValue = typeof item['icon'] === 'string' ? item['icon'].trim() : '';
  const orderValue = item['order'];

  return {
    label: labelValue,
    path: pathValue,
    icon: iconValue.length ? iconValue : undefined,
    order: typeof orderValue === 'number' ? orderValue : undefined,
    exact: item['exact'] === true
  };
};

export const normalizeMenuGroup = (raw: unknown, fallback: MenuGroupDefaults): MenuGroupDefaults => {
  if (!raw || typeof raw !== 'object') {
    return { ...fallback };
  }

  const group = raw as Record<string, unknown>;
  const idValue = typeof group['id'] === 'string' ? group['id'].trim() : '';
  const labelValue = typeof group['label'] === 'string' ? group['label'].trim() : '';
  const orderValue = group['order'];

  return {
    id: idValue.length ? idValue : fallback.id,
    label: labelValue.length ? labelValue : fallback.label,
    order: typeof orderValue === 'number' ? orderValue : fallback.order
  };
};

export const normalizeRemoteMenuPayload = (
  raw: unknown,
  fallback: MenuGroupDefaults
): MenuGroup => {
  const payload: RemoteMenuPayload =
    Array.isArray(raw) || raw === null || raw === undefined ? { items: raw } : (raw as RemoteMenuPayload);

  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  const items = rawItems
    .map((item) => normalizeMenuItem(item))
    .filter((item): item is MenuItem => item !== null);

  const group = normalizeMenuGroup(payload.group, fallback);

  return {
    ...group,
    items
  };
};

export const isContractDrawerIntent = (value: unknown): value is ContractDrawerIntent => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const intent = value as ContractDrawerIntent;

  return (
    intent.kind === CONTRACT_DRAWER_KIND &&
    intent.version === CONTRACT_DRAWER_VERSION &&
    isNonEmptyString(intent.origin) &&
    isNonEmptyString(intent.correlationId) &&
    !!intent.data &&
    isNonEmptyString(intent.data.contratoId) &&
    isNonEmptyString(intent.data.conta) &&
    isNonEmptyString(intent.data.cooperado) &&
    isNonEmptyString(intent.data.cooperativa) &&
    isNonEmptyString(intent.data.agencia)
  );
};

export const isContractDrawerResult = (value: unknown): value is ContractDrawerResult => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const result = value as ContractDrawerResult;

  if (result.action === 'cancel') {
    return true;
  }

  if (result.action !== 'saved' || !result.payload) {
    return false;
  }

  const payload = result.payload;

  return (
    isNonEmptyString(payload.contratoId) &&
    isNonEmptyString(payload.cooperado) &&
    isNonEmptyString(payload.conta) &&
    isString(payload.cooperativa) &&
    isString(payload.agencia) &&
    isNonEmptyString(payload.modalidade) &&
    Number.isFinite(payload.limite) &&
    isString(payload.status) &&
    isIsoStringOrNull(payload.inicioISO) &&
    isIsoStringOrNull(payload.vencimentoISO) &&
    isString(payload.observacoes)
  );
};
