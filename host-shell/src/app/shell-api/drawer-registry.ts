import { DrawerSize, CONTRACT_DRAWER_INTENT_KEY, DrawerIntentKey } from 'shared-logic/core';

export type DrawerRegistryEntry = {
  key: DrawerIntentKey;
  remoteName: string;
  exposedModule: string;
  exportName: string;
  title: string;
  subtitle?: string;
  sectionTitle?: string;
  size?: DrawerSize;
  loadingLabel?: string;
  errorLabel?: string;
};

export const DRAWER_REGISTRY: Record<string, DrawerRegistryEntry> = {
  [CONTRACT_DRAWER_INTENT_KEY]: {
    key: CONTRACT_DRAWER_INTENT_KEY,
    remoteName: 'remote-gde',
    exposedModule: './ContractDrawerForm',
    exportName: 'ContractDrawerFormComponent',
    title: 'Detalhes do contrato',
    subtitle: 'Formulario do GDE carregado pelo Conta Corrente.',
    sectionTitle: 'Dados do contrato',
    size: 'lg',
    loadingLabel: 'Carregando formulario do GDE.',
    errorLabel: 'Nao foi possivel carregar o formulario do GDE.'
  }
};

export const resolveDrawerEntry = (key: DrawerIntentKey): DrawerRegistryEntry | null =>
  DRAWER_REGISTRY[key] ?? null;
