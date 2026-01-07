# shared-logic

## Objetivo
Biblioteca de contratos e tokens compartilhados entre host e remotes (drawers, intents, Shell API). Fontes: `shared-logic/src/core.ts`, `shared-logic/src/angular.ts`.

## Conteudos principais
- Tipos de drawer e intents (`ContractDrawerIntent`). Fonte: `shared-logic/src/core.ts`.
- Token DI `SHELL_API` e `DRAWER_DATA`. Fonte: `shared-logic/src/angular.ts`.

## Build e empacotamento
```bash
npm install
npm run build
npm pack
```
Fonte: `shared-logic/package.json`.

O fluxo padrao do repo gera um tarball em `releases/` e usa `file:` nas apps. Fontes: `start-demo.ps1`, `start-demo.sh`, `host-shell/package.json`.

## Compatibilidade
`peerDependencies` define `@angular/core >=19 <21`. Fonte: `shared-logic/package.json`.

## Uso
Importe tipos e tokens conforme necessidade:
```ts
import { SHELL_API } from 'shared-logic/angular';
```
Fonte: `shared-logic/src/angular.ts`.

## Versionamento
Semver recomendado (a confirmar). Fonte: nao ha politica explicita no repo.
