import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WebComponentLoaderService {
  private readonly scripts = new Map<string, Promise<void>>();
  private readonly styles = new Map<string, Promise<void>>();

  loadModuleScript(url: string): Promise<void> {
    if (typeof document === 'undefined') {
      return Promise.resolve();
    }

    const cached = this.scripts.get(url);
    if (cached) {
      return cached;
    }

    const existing = document.querySelector(`script[data-remote-url="${url}"]`);
    if (existing) {
      return Promise.resolve();
    }

    const promise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = url;
      script.async = true;
      script.dataset['remoteUrl'] = url;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
      document.head.appendChild(script);
    });

    this.scripts.set(url, promise);
    return promise;
  }

  loadStyle(url: string): Promise<void> {
    if (typeof document === 'undefined') {
      return Promise.resolve();
    }

    const cached = this.styles.get(url);
    if (cached) {
      return cached;
    }

    const existing = document.querySelector(`link[data-remote-url="${url}"]`);
    if (existing) {
      return Promise.resolve();
    }

    const promise = new Promise<void>((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.dataset['remoteUrl'] = url;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load stylesheet: ${url}`));
      document.head.appendChild(link);
    });

    this.styles.set(url, promise);
    return promise;
  }

  async loadResources(options: { scriptUrl: string; styleUrl?: string }): Promise<void> {
    const tasks = [this.loadModuleScript(options.scriptUrl)];
    if (options.styleUrl) {
      tasks.push(this.loadStyle(options.styleUrl));
    }

    await Promise.all(tasks);
  }
}
