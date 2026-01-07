# Host Shell

## Responsabilidades
- Layout, navegacao e menu agregando remotes e web components. Fontes: `host-shell/src/app/app-shell.component.ts`, `host-shell/src/app/app.component.ts`.
- Runtime config e manifest (config.json + federation.manifest.json). Fontes: `host-shell/src/app/runtime-config.ts`, `host-shell/public/federation.manifest.json`.
- Roteamento com fallback e resiliencia. Fontes: `host-shell/src/app/app.routes.ts`, `host-shell/src/app/module-unavailable/module-unavailable.component.ts`.
- Shell API (drawer, telemetria) para remotes. Fonte: `host-shell/src/app/shell-api/shell-api.service.ts`.

## Rodar apenas o host
```bash
npm install
npm run start
```
Porta 4200. Fonte: `host-shell/angular.json`.

Para servir o build estatico:
```bash
npm run build
npm run serve:dist
```
Fonte: `host-shell/package.json`.

## Runtime config
`public/config.json` controla:
- `manifestUrl`
- `telemetryUrl` / `telemetrySampleRate`
- `remotes` (inline manifest)
- `webComponents` (baseUrl, menuPath)

Fontes: `host-shell/public/config.json`, `host-shell/src/app/runtime-config.ts`.

## Como adicionar rota para um remote
1) Crie ou atualize o remote e exponha `./Routes`. Fonte: `remote-sales/federation.config.js`.
2) Adicione a rota no host usando `loadRemoteRoutes`. Fonte: `host-shell/src/app/app.routes.ts`.
3) Atualize o manifest/config para apontar o remote. Fonte: `host-shell/public/federation.manifest.json`.
4) Publique `menu.json` e `remote-info.json` no remote. Fonte: `remote-sales/public/menu.json`.

## Estrategia de compartilhamento
O host compartilha Angular, rxjs e libs compartilhadas via federation com `shareAll` e singletons. Fonte: `host-shell/federation.config.js`.

## Observabilidade
Telemetria e configurada via `config.json` e enviada pelo host. Fonte: `host-shell/src/app/app.config.ts`.
