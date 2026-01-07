# Remote GDE

## Proposito
Remote federado com fluxos de Gestao de Empresas (GDE) e formulario de contrato para drawer remoto. Fontes: `remote-gde/src/app/gde.routes.ts`, `remote-gde/src/app/contract-drawer-form.component.ts`.

## Como rodar isolado
```bash
npm install
npm run start
```
Porta 4202. Fonte: `remote-gde/angular.json`.

Para build e serve estatico:
```bash
npm run build
npm run serve:dist
```
Fonte: `remote-gde/package.json`.

## Bootstrap e federation
- Inicializa Native Federation em `src/main.ts`. Fonte: `remote-gde/src/main.ts`.
- Expondo `./Routes` e `./ContractDrawerForm`. Fonte: `remote-gde/federation.config.js`.

## Rotas expostas
- `/gde` (home)
- `/gde/contas-a-pagar`
- `/gde/inclusao-parcela-a-pagar`
- `/gde/alteracao-parcela-a-pagar`
- `/gde/adiantamento-de-pagamento`
- `/gde/legacy-form/new` e `/gde/legacy-form/:id`

Fonte: `remote-gde/src/app/gde.routes.ts`.

## Como o host consome
- Rotas via `loadRemoteModule`. Fonte: `host-shell/src/app/app.routes.ts`.
- Drawer remoto via `ShellApi` e `drawer-registry`. Fontes: `host-shell/src/app/shell-api/shell-api.service.ts`, `host-shell/src/app/shell-api/drawer-registry.ts`.

## Menu e metadata
- Menu publicado em `public/menu.json`. Fonte: `remote-gde/public/menu.json`.
- Metadata publicada em `public/remote-info.json`. Fonte: `remote-gde/public/remote-info.json`.

## Dependencias compartilhadas
Angular, rxjs, `shared-logic` e `shared-ui-lib` sao compartilhados via federation. Fonte: `remote-gde/federation.config.js`.
