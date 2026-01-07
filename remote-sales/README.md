# Remote Sales

## Proposito
Remote federado responsavel pelo dominio de Vendas. Fonte: `remote-sales/src/app/sales.component.ts`.

## Como rodar isolado
```bash
npm install
npm run start
```
Porta 4201. Fonte: `remote-sales/angular.json`.

Para build e serve estatico:
```bash
npm run build
npm run serve:dist
```
Fonte: `remote-sales/package.json`.

## Bootstrap e federation
- Inicializa Native Federation em `src/main.ts`. Fonte: `remote-sales/src/main.ts`.
- Expondo rotas via `./Routes`. Fonte: `remote-sales/federation.config.js`.
- Rotas exportadas em `sales.routes.ts`. Fonte: `remote-sales/src/app/sales.routes.ts`.

## Como o host consome
O host carrega `./Routes` via `loadRemoteModule`. Fonte: `host-shell/src/app/app.routes.ts`.

## Menu e metadata
- Menu publicado em `public/menu.json`. Fonte: `remote-sales/public/menu.json`.
- Metadata publicada em `public/remote-info.json`. Fonte: `remote-sales/public/remote-info.json`.

## Dependencias compartilhadas
Angular, rxjs, `shared-logic` e `shared-ui-lib` sao compartilhados via federation. Fonte: `remote-sales/federation.config.js`.
