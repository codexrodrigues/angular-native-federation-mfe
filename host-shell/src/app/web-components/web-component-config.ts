import { getRuntimeConfig } from '../runtime-config';

export type WebComponentConfig = {
  name: string;
  label: string;
  baseUrl: string;
  routeSegment: string;
  accent: string;
  icon: string;
  menuPath: string;
};

const DEFAULT_WEB_COMPONENT_CONFIG: WebComponentConfig[] = [
  {
    name: 'remote-credito',
    label: 'Credito (v19)',
    baseUrl: 'http://localhost:4304/browser/',
    routeSegment: 'credito',
    accent: '#f08c00',
    icon: 'credit_score',
    menuPath: 'menu.json'
  }
];

const resolveWebComponentConfig = (): WebComponentConfig[] => {
  const config = getRuntimeConfig();
  const overrides = config.webComponents ?? {};
  return DEFAULT_WEB_COMPONENT_CONFIG.map((component) => {
    const override = overrides[component.name];
    if (!override?.baseUrl) {
      return component;
    }
    return {
      ...component,
      ...override,
      baseUrl: override.baseUrl,
      menuPath: override.menuPath ?? component.menuPath
    };
  });
};

export const WEB_COMPONENT_CONFIG: WebComponentConfig[] = resolveWebComponentConfig();

const WEB_COMPONENT_BY_NAME = WEB_COMPONENT_CONFIG.reduce<Record<string, WebComponentConfig>>(
  (acc, component) => {
    acc[component.name] = component;
    return acc;
  },
  {}
);

const WEB_COMPONENT_BY_ROUTE = WEB_COMPONENT_CONFIG.reduce<Record<string, WebComponentConfig>>(
  (acc, component) => {
    acc[component.routeSegment] = component;
    return acc;
  },
  {}
);

export const getWebComponentByName = (name: string) => WEB_COMPONENT_BY_NAME[name] ?? null;
export const getWebComponentByRoute = (segment?: string | null) =>
  segment ? WEB_COMPONENT_BY_ROUTE[segment] ?? null : null;
