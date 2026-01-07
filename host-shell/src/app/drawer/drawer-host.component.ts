import {
  AfterViewInit,
  Component,
  ComponentRef,
  DestroyRef,
  EnvironmentInjector,
  HostListener,
  Injector,
  ViewChild,
  ViewContainerRef,
  effect,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetailsDrawerComponent } from 'shared-ui-lib';
import { DRAWER_DATA, DrawerRef } from 'shared-logic/angular';
import { HostDrawerService } from './host-drawer.service';

type DrawerState = ReturnType<HostDrawerService['drawerState']>;

@Component({
  selector: 'app-drawer-host',
  standalone: true,
  imports: [CommonModule, DetailsDrawerComponent],
  template: `
    <lib-details-drawer
      [open]="drawerState().open"
      [title]="drawerState().title"
      [subtitle]="drawerState().subtitle"
      [sectionTitle]="drawerState().sectionTitle"
      [size]="drawerState().size"
      [width]="drawerState().width"
      [panelClass]="drawerState().panelClass"
      [ariaLabel]="drawerState().ariaLabel"
      (close)="requestClose()"
    >
      <div drawer-body>
        @if (drawerState().loading) {
          <div class="drawer-status">
            <div class="drawer-status__title">Carregando conteudo...</div>
            <div class="drawer-status__subtitle">
              {{ drawerState().loadingLabel || 'Preparando modulo remoto.' }}
            </div>
          </div>
        } @else if (drawerState().error) {
          <div class="drawer-status drawer-status--error">
            <div class="drawer-status__title">Falha ao carregar</div>
            <div class="drawer-status__subtitle">{{ drawerState().error }}</div>
          </div>
        }
        <ng-template #drawerContentHost></ng-template>
      </div>
    </lib-details-drawer>
  `,
  styles: [
    `
      .drawer-status {
        display: grid;
        gap: 6px;
        padding: 16px;
        border-radius: 16px;
        background: var(--color-surface-background-low, #ffffff);
        border: 1px dashed var(--color-surface-stroke-medium, #d5dae2);
        color: var(--color-surface-text-default-medium, #515151);
      }

      .drawer-status__title {
        font-weight: 600;
        color: var(--color-surface-text-default-high, #002a33);
      }

      .drawer-status--error {
        border-color: color-mix(in srgb, var(--color-denotative-error-default, #f7406c) 40%, #d5dae2);
      }
    `
  ]
})
export class DrawerHostComponent implements AfterViewInit {
  private readonly drawerService = inject(HostDrawerService);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewReady = signal(false);

  readonly drawerState = this.drawerService.drawerState;

  @ViewChild('drawerContentHost', { read: ViewContainerRef })
  private contentHost?: ViewContainerRef;

  private contentRef?: ComponentRef<unknown>;
  private clearHandle: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      if (!this.viewReady()) {
        return;
      }

      const state = this.drawerState();

      if (state.open) {
        this.renderContent(state);
        this.lockScroll();
        this.focusPanel();
      } else {
        this.unlockScroll();
        this.scheduleClear();
      }
    });

    this.destroyRef.onDestroy(() => {
      this.unlockScroll();
      this.clearContent();
    });
  }

  ngAfterViewInit(): void {
    this.viewReady.set(true);
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscape(event: KeyboardEvent): void {
    if (!this.drawerState().open) {
      return;
    }

    event.preventDefault();
    this.requestClose();
  }

  requestClose(): void {
    this.drawerService.close();
  }

  private renderContent(state: DrawerState): void {
    if (!this.contentHost || !state.component) {
      if (this.contentHost) {
        this.clearContent();
      }
      return;
    }

    if (this.clearHandle) {
      clearTimeout(this.clearHandle);
      this.clearHandle = null;
    }

    if (this.contentRef && this.contentRef.componentType === state.component) {
      return;
    }

    this.clearContent();

    const injector = Injector.create({
      providers: [
        { provide: DrawerRef, useValue: this.drawerService.getActiveRef() },
        { provide: DRAWER_DATA, useValue: state.data }
      ],
      parent: this.environmentInjector
    });

    const envInjector =
      state.environmentInjector && typeof state.environmentInjector === 'object'
        ? (state.environmentInjector as EnvironmentInjector)
        : this.environmentInjector;

    this.contentRef = this.contentHost.createComponent(state.component, {
      environmentInjector: envInjector,
      injector
    });
  }

  private scheduleClear(): void {
    if (!this.contentRef) {
      return;
    }

    if (this.clearHandle) {
      clearTimeout(this.clearHandle);
    }

    this.clearHandle = setTimeout(() => {
      this.clearContent();
    }, 220);
  }

  private clearContent(): void {
    this.clearHandle = null;
    this.contentRef?.destroy();
    this.contentRef = undefined;
    this.contentHost?.clear();
  }

  private lockScroll(): void {
    if (typeof document === 'undefined') {
      return;
    }
    document.body.style.overflow = 'hidden';
  }

  private unlockScroll(): void {
    if (typeof document === 'undefined') {
      return;
    }
    document.body.style.overflow = '';
  }

  private focusPanel(): void {
    if (typeof document === 'undefined') {
      return;
    }

    requestAnimationFrame(() => {
      const panel = document.querySelector('.details-drawer__panel') as HTMLElement | null;
      panel?.focus();
    });
  }
}
