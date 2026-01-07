import { Injectable, signal } from '@angular/core';
import { DrawerOpenOptions, DrawerRef, DrawerService, DrawerSize } from 'shared-logic/core';

type DrawerState = {
  open: boolean;
  component: any | null;
  title: string;
  subtitle?: string;
  sectionTitle?: string;
  size?: DrawerSize;
  width: number;
  data?: unknown;
  panelClass?: string | string[];
  ariaLabel?: string;
  environmentInjector?: unknown;
  loading: boolean;
  loadingLabel?: string;
  error?: string;
};

class HostDrawerRef extends DrawerRef<unknown> {
  private resolveClose!: (result?: unknown) => void;
  readonly afterClosed = new Promise<unknown | undefined>((resolve) => {
    this.resolveClose = resolve;
  });

  constructor(private readonly requestClose: (result?: unknown) => void) {
    super();
  }

  close(result?: unknown): void {
    this.requestClose(result);
  }

  notifyClosed(result?: unknown): void {
    this.resolveClose(result);
  }
}

const CLOSED_STATE: DrawerState = {
  open: false,
  component: null,
  title: '',
  size: 'md',
  width: 420,
  loading: false
};

@Injectable({ providedIn: 'root' })
export class HostDrawerService extends DrawerService {
  private readonly state = signal<DrawerState>({ ...CLOSED_STATE });
  readonly drawerState = this.state.asReadonly();

  private activeRef?: HostDrawerRef;
  private returnFocusTo: HTMLElement | null = null;

  open<T = unknown, D = unknown, R = unknown>(
    component: any,
    options?: DrawerOpenOptions<D>
  ): DrawerRef<R> {
    if (typeof document !== 'undefined') {
      const activeElement = document.activeElement;
      this.returnFocusTo = activeElement instanceof HTMLElement ? activeElement : null;
    }

    if (this.activeRef) {
      this.close();
    }

    const ref = new HostDrawerRef((result) => this.close(result));
    this.activeRef = ref;

    this.state.set({
      open: true,
      component,
      title: options?.title ?? '',
      subtitle: options?.subtitle,
      sectionTitle: options?.sectionTitle,
      size: options?.size ?? CLOSED_STATE.size,
      width: options?.width ?? CLOSED_STATE.width,
      data: options?.data,
      panelClass: options?.panelClass,
      ariaLabel: options?.ariaLabel,
      environmentInjector: options?.environmentInjector,
      loading: false,
      loadingLabel: undefined,
      error: undefined
    });

    return ref as DrawerRef<R>;
  }

  openLoading<D = unknown>(options?: DrawerOpenOptions<D> & { loadingLabel?: string }): DrawerRef {
    if (typeof document !== 'undefined') {
      const activeElement = document.activeElement;
      this.returnFocusTo = activeElement instanceof HTMLElement ? activeElement : null;
    }

    if (this.activeRef) {
      this.close();
    }

    const ref = new HostDrawerRef((result) => this.close(result));
    this.activeRef = ref;

    this.state.set({
      open: true,
      component: null,
      title: options?.title ?? '',
      subtitle: options?.subtitle,
      sectionTitle: options?.sectionTitle,
      size: options?.size ?? CLOSED_STATE.size,
      width: options?.width ?? CLOSED_STATE.width,
      data: options?.data,
      panelClass: options?.panelClass,
      ariaLabel: options?.ariaLabel,
      environmentInjector: options?.environmentInjector,
      loading: true,
      loadingLabel: options?.loadingLabel,
      error: undefined
    });

    return ref;
  }

  getActiveRef(): DrawerRef | undefined {
    return this.activeRef;
  }

  setDrawerContent(component: any, data?: unknown, environmentInjector?: unknown): void {
    if (!this.state().open) {
      return;
    }

    this.state.update((state) => ({
      ...state,
      component,
      data,
      environmentInjector,
      loading: false,
      loadingLabel: undefined,
      error: undefined
    }));
  }

  setDrawerError(message: string): void {
    if (!this.state().open) {
      return;
    }

    this.state.update((state) => ({
      ...state,
      component: null,
      loading: false,
      loadingLabel: undefined,
      error: message
    }));
  }

  close(result?: unknown): void {
    if (!this.state().open) {
      this.activeRef?.notifyClosed(result);
      this.activeRef = undefined;
      return;
    }

    this.state.update((state) => ({
      ...state,
      open: false,
      component: null,
      data: undefined,
      environmentInjector: undefined,
      loading: false,
      loadingLabel: undefined,
      error: undefined
    }));

    this.activeRef?.notifyClosed(result);
    this.activeRef = undefined;

    if (this.returnFocusTo) {
      this.returnFocusTo.focus();
      this.returnFocusTo = null;
    }
  }
}
