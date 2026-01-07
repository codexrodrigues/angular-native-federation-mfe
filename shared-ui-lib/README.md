# shared-ui-lib

## Objetivo
Biblioteca de componentes UI e tokens CSS consumidos por host e remotes. Fontes: `shared-ui-lib/src/public-api.ts`, `shared-ui-lib/src/lib/tokens.css`.

## Componentes exportados
- `content-card`, `page-header`, `action-bar`, `corporate-table`, `details-drawer`.

Fonte: `shared-ui-lib/src/public-api.ts`.

## Build
```bash
npm install
npm run build
```
Fonte: `shared-ui-lib/package.json`.

O build gera `dist/` via ng-packagr. Fonte: `shared-ui-lib/ng-package.json`.

## Tokens CSS
`tokens.css` e copiado para o pacote e exportado via `postbuild`. Fontes: `shared-ui-lib/ng-package.json`, `shared-ui-lib/scripts/postbuild.js`.

Uso:
```scss
@import 'shared-ui-lib/tokens.css';
```
Fonte: `host-shell/src/styles.scss`.

## Consumo no repo
Apps consomem o dist via `file:../shared-ui-lib/dist`. Fontes: `host-shell/package.json`, `remote-sales/package.json`.

## Compatibilidade
`peerDependencies` indicam Angular 20.x. Fonte: `shared-ui-lib/package.json`.

## Versionamento
Semver recomendado (a confirmar). Fonte: nao ha politica explicita no repo.
