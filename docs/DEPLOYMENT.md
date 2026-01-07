# Deploy

## Build outputs
- Host shell: `dist/host-shell/browser` (Angular esbuild). Fonte: `host-shell/angular.json`.
- Remotes federados: `dist/<remote>/browser`. Fontes: `remote-sales/angular.json`, `remote-gde/angular.json`, `remote-accounts/angular.json`.
- Web component Credito: `dist/remote-credito-element/browser`. Fonte: `remote-credito/angular.json`.

Comandos de build (exemplos):
```bash
cd host-shell && npm run build
cd remote-sales && npm run build
cd remote-gde && npm run build
cd remote-accounts && npm run build
cd remote-credito && npm run build:element
```
Fontes: `host-shell/package.json`, `remote-credito/package.json`.

## Publicacao
Os builds sao estaticos e podem ser hospedados em CDN/servidor estatico (http-server no demo). Fontes: `host-shell/package.json`, `remote-sales/package.json`.

Arquivos criticos por app:
- `remoteEntry.json` (remotes federados)
- `federation.manifest.json` (host)
- `menu.json` e `remote-info.json` (metadata e menu)

Fontes: `host-shell/public/federation.manifest.json`, `remote-sales/public/menu.json`, `remote-sales/public/remote-info.json`.

## Runtime config e manifest
- O host consome `config.json` para `manifestUrl`, `telemetryUrl` e `webComponents`. Fonte: `host-shell/public/config.json`.
- Para atualizar remotes sem rebuild do host, publique um novo manifest e aponte `manifestUrl`. Fonte: `host-shell/src/app/runtime-config.ts`.

## Cache headers
Recomendacoes de cache para `remoteEntry.json`, `menu.json` e `federation.manifest.json` estao em `docs/cache-headers.md`.

## Versionamento e rollback
- Prefira arquivos com hash para bundles e manifest sem cache agressivo. Fonte: `host-shell/angular.json` (outputHashing em production).
- O web component usa `outputHashing: none` no build (atual), o que exige cuidado com cache. Fonte: `remote-credito/angular.json`.
- Rollback pode ser feito apontando `manifestUrl` para um manifest anterior. Fonte: `host-shell/src/app/runtime-config.ts`.

## Observabilidade
Telemetria e enviada para endpoint configuravel via `config.json` (amostragem). Fonte: `host-shell/src/app/app.config.ts`.
