# Remote Accounts

## Proposito
Remote federado para Conta Corrente (extratos, limites e home). Fonte: `remote-accounts/src/app/accounts.routes.ts`.

## Como rodar isolado
```bash
npm install
npm run start
```
Porta 4203. Fonte: `remote-accounts/angular.json`.

Para build e serve estatico:
```bash
npm run build
npm run serve:dist
```
Fonte: `remote-accounts/package.json`.

## Bootstrap e federation
- Inicializa Native Federation em `src/main.ts`. Fonte: `remote-accounts/src/main.ts`.
- Expondo `./Routes`. Fonte: `remote-accounts/federation.config.js`.

## Rotas expostas
- `/conta-corrente` (home)
- `/conta-corrente/extratos`
- `/conta-corrente/limites-e-bloqueios`

Fonte: `remote-accounts/src/app/accounts.routes.ts`.

## Como o host consome
O host carrega `./Routes` via `loadRemoteModule`. Fonte: `host-shell/src/app/app.routes.ts`.

## Menu e metadata
- Menu publicado em `public/menu.json`. Fonte: `remote-accounts/public/menu.json`.
- Metadata publicada em `public/remote-info.json`. Fonte: `remote-accounts/public/remote-info.json`.

## Dependencias compartilhadas
Angular, rxjs, `shared-logic` e `shared-ui-lib` sao compartilhados via federation. Fonte: `remote-accounts/federation.config.js`.
