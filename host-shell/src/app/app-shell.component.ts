import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DrawerHostComponent } from './drawer/drawer-host.component';
import { ToastHostComponent } from './toast/toast-host.component';

type ThemeOption = {
  id: string;
  label: string;
  icon: string;
};

type MenuItem = {
  label: string;
  path: string;
  icon?: string;
  order?: number;
  exact?: boolean;
};

type MenuGroup = {
  id: string;
  label: string;
  order?: number;
  items: MenuItem[];
};

type RemoteStatusView = {
  name: string;
  label: string;
  accent: string;
  status: 'loading' | 'ready' | 'missing' | 'error';
  statusLabel: string;
  kind: 'federated' | 'web-component';
  url?: string;
  angular?: string;
  libs: Array<{ name: string; version: string }>;
  stats: Array<{ name: string; value: string }>;
  updatedAt?: string;
};

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    DrawerHostComponent,
    ToastHostComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppShellComponent {
  @Input({ required: true }) currentAppTitle = '';
  @Input() currentAppIcon = '';
  @Input() currentThemeIcon = '';
  @Input() activeTheme = '';
  @Input() isThemeMenuOpen = false;
  @Input() themeOptions: ThemeOption[] = [];

  @Input() menuGroups: MenuGroup[] = [];
  @Input() menuLoading = false;
  @Input() menuError: string | null = null;
  @Input() exactMatchOptions = { exact: true };
  @Input() partialMatchOptions = { exact: false };
  @Input() remoteLoading = false;
  @Input() remoteLoadingLabel = '';
  @Input() remoteLoadingIcon = '';
  @Input() remoteLoadingAccent = '';
  @Input() remoteStatusItems: RemoteStatusView[] = [];
  @Input() activeRemoteStatus: RemoteStatusView | null = null;

  @Output() toggleThemeMenu = new EventEmitter<Event>();
  @Output() captureTopbarMenus = new EventEmitter<Event>();
  @Output() closeTopbarMenus = new EventEmitter<void>();
  @Output() selectTheme = new EventEmitter<string>();
  @Output() loadRemoteMenus = new EventEmitter<boolean | undefined>();
}
