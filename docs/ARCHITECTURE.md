# Arquitetura

## Visao geral
O host-shell orquestra remotes federados (Sales, GDE, Accounts) e um web component isolado (Credito), compartilhando contratos e UI. Fontes: `host-shell/src/app/app.component.ts`, `host-shell/src/app/app.routes.ts`, `host-shell/src/app/web-components/web-component-config.ts`.

## Runtime config e manifest
- O host resolve configuracao em runtime via `loadRuntimeConfig` e aplica fallback para `config.json`. Fontes: `host-shell/src/app/runtime-config.ts`, `host-shell/public/config.json`.
- O manifest padrao aponta para remotes locais e pode ser substituido via runtime config. Fontes: `host-shell/public/federation.manifest.json`, `host-shell/src/app/runtime-config.ts`.
- Quando `config.remotes` e informado, o host gera um manifest inline (data URL) para inicializar federation. Fonte: `host-shell/src/app/runtime-config.ts`.
- O bootstrap do host injeta o manifest no `initFederation`. Fonte: `host-shell/src/main.ts`.

## Federation e compartilhamento
- Os apps usam Native Federation com `shareAll`, singletons para Angular e libs compartilhadas, e `strictVersion` ajustado por pacote. Fontes: `host-shell/federation.config.js`, `remote-sales/federation.config.js`.
- `shareAngularLocales` garante locale pt. Fonte: `host-shell/federation.config.js`.
- `skip` remove submodulos de rxjs que nao sao usados em runtime. Fonte: `host-shell/federation.config.js`.

Trade-offs:
- `singleton + strictVersion: false` para Angular permite evolucao gradual, mas pode introduzir incompatibilidade em runtime se as versoes divergem. Fonte: `remote-accounts/federation.config.js`.
- `strictVersion: true` para `shared-logic` e `shared-ui-lib` protege contratos e tokens, mas exige alinhamento de versoes. Fonte: `remote-gde/federation.config.js`.

## Roteamento e fallback
- O host carrega rotas remotas via `loadRemoteModule` com retry e timeout. Fonte: `host-shell/src/app/app.routes.ts`.
- Quando o remote nao responde, o host usa fallback local `ModuleUnavailableComponent`. Fonte: `host-shell/src/app/module-unavailable/module-unavailable.component.ts`.

## Menus e metadata
- Cada remote publica `public/menu.json`, consumido pelo host no sidebar. Fontes: `remote-sales/public/menu.json`, `host-shell/src/app/app.component.ts`.
- O host agrega menus de remotes federados e web components, com timeout e telemetria. Fonte: `host-shell/src/app/app.component.ts`.
- Metadata por remote: `public/remote-info.json` usado para status e handshake. Fontes: `remote-accounts/public/remote-info.json`, `remote-credito/public/remote-info.json`.

## Web component Credito (Angular 19)
- O web component e criado com `createCustomElement` e build dedicado. Fonte: `remote-credito/src/element.ts`.
- O host baixa script/style a partir de `remote-info.json` e injeta `shellApi` + `shellContext`. Fonte: `host-shell/src/app/credito-element/credito-element-page.component.ts`.
- A integracao usa eventos customizados (`creditoAction`) e uma API JS injetada no elemento. Fonte: `remote-credito/src/app/credito-element.component.ts`.

Motivacao e trade-off:
- Isolar o web component permite usar Angular 19 sem compartilhar runtime com os remotes 20, com custo de bundle separado e contrato explicito via bridge. Fontes: `remote-credito/package.json`, `host-shell/package.json`.

## Shell API e contratos
- Contratos e intents vivem em `shared-logic`, com tokens Angular para DI. Fontes: `shared-logic/src/core.ts`, `shared-logic/src/angular.ts`.
- O host implementa `ShellApi` para drawers e telemetria, com resiliencia. Fonte: `host-shell/src/app/shell-api/shell-api.service.ts`.
- Drawer remoto (GDE) e registrado por intent key. Fonte: `host-shell/src/app/shell-api/drawer-registry.ts`.

## Resiliencia e telemetria
- Circuit breaker, retry e timeout para remotes e fetch. Fonte: `host-shell/src/app/resilience/remote-resilience.ts`.
- Telemetria envia eventos para endpoint configuravel e loga no console. Fonte: `host-shell/src/app/telemetry/telemetry.service.ts`, `host-shell/src/app/app.config.ts`.

## Padroes e convencoes
- Nomes de remotes seguem `remote-*` e aparecem no manifest. Fonte: `host-shell/public/federation.manifest.json`.
- Rotas remotas ficam em `src/app/*routes.ts` e sao expostas via federation. Fonte: `remote-sales/src/app/sales.routes.ts`, `remote-sales/federation.config.js`.
- Menus em `public/menu.json` e metadata em `public/remote-info.json`. Fontes: `remote-gde/public/menu.json`, `remote-gde/public/remote-info.json`.
- Web components sao descritos em `web-component-config.ts` com `baseUrl` e `menuPath`. Fonte: `host-shell/src/app/web-components/web-component-config.ts`.
