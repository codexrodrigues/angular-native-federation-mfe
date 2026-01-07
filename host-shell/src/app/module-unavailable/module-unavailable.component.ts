import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-module-unavailable',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 20px; border: 1px solid red; background-color: #ffe6e6; color: red;">
      <h1>Módulo Indisponível</h1>
      <p>O módulo remoto não pôde ser carregado. Por favor, tente novamente mais tarde.</p>
      <p>Isso pode ocorrer se o servidor do aplicativo filho estiver fora do ar.</p>
    </div>
  `,
  styles: []
})
export class ModuleUnavailableComponent { }
