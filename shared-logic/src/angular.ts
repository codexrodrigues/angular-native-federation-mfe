import { InjectionToken } from '@angular/core';
import type { ShellApi } from './core';

export * from './core';

export const DRAWER_DATA = new InjectionToken<unknown>('MFE_DRAWER_DATA');
export const SHELL_API = new InjectionToken<ShellApi>('SHELL_API');
