import { createApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { createCustomElement } from '@angular/elements';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { CreditoElementComponent } from './app/credito-element.component';

const ELEMENT_NAME = 'remote-credito';

const registerElement = async () => {
  if (typeof window === 'undefined') {
    return;
  }

  if (customElements.get(ELEMENT_NAME)) {
    return;
  }

  const appRef = await createApplication({
    providers: [provideExperimentalZonelessChangeDetection(), provideAnimations()]
  });

  const element = createCustomElement(CreditoElementComponent, { injector: appRef.injector });
  customElements.define(ELEMENT_NAME, element);
};

registerElement().catch((error) =>
  console.error('[remote-credito] Failed to register element', error)
);
