import { Injectable, signal } from '@angular/core';

export type ToastLevel = 'info' | 'success' | 'warning' | 'error';

export type ToastOptions = {
  message: string;
  title?: string;
  level?: ToastLevel;
  durationMs?: number;
};

type ToastItem = {
  id: string;
  message: string;
  title?: string;
  level: ToastLevel;
  durationMs: number;
  createdAt: number;
};

const DEFAULT_DURATION_MS = 4200;
const MAX_TOASTS = 4;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly state = signal<ToastItem[]>([]);
  readonly toasts = this.state.asReadonly();
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  show(options: ToastOptions): string | null {
    if (!options?.message) {
      return null;
    }

    const id = `toast_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const level: ToastLevel = options.level ?? 'info';
    const durationMs =
      typeof options.durationMs === 'number' ? Math.max(0, options.durationMs) : DEFAULT_DURATION_MS;
    const item: ToastItem = {
      id,
      message: options.message,
      title: options.title,
      level,
      durationMs,
      createdAt: Date.now()
    };

    this.state.update((items) => {
      const next = [...items, item];
      if (next.length <= MAX_TOASTS) {
        return next;
      }

      const overflow = next.length - MAX_TOASTS;
      const trimmed = next.slice(overflow);
      for (let i = 0; i < overflow; i += 1) {
        const dropped = next[i];
        if (dropped) {
          this.clearTimer(dropped.id);
        }
      }
      return trimmed;
    });

    if (durationMs > 0) {
      const timer = setTimeout(() => this.dismiss(id), durationMs);
      this.timers.set(id, timer);
    }

    return id;
  }

  dismiss(id: string): void {
    if (!id) {
      return;
    }
    this.clearTimer(id);
    this.state.update((items) => items.filter((item) => item.id !== id));
  }

  clear(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.state.set([]);
  }

  private clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (!timer) {
      return;
    }
    clearTimeout(timer);
    this.timers.delete(id);
  }
}
