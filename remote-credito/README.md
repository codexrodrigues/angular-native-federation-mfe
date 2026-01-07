# Remote Credito (Web Component)

## Proposito
Web component em Angular 19 para simular convivencia de versoes e integracao via Shell API. Fontes: `remote-credito/src/element.ts`, `remote-credito/src/app/credito-element.component.ts`.

## Build e serve
```bash
npm install
npm run build:element
npm run serve:element
```
Porta 4304. Fonte: `remote-credito/package.json`.

## Entry point
- O build usa `src/element.ts` como entry. Fonte: `remote-credito/angular.json`.
- `src/main.ts` e apenas um aviso. Fonte: `remote-credito/src/main.ts`.

## Integracao com o host
- Handshake e metadata via `public/remote-info.json`. Fonte: `remote-credito/public/remote-info.json`.
- Script e style sao carregados pelo host. Fonte: `host-shell/src/app/credito-element/credito-element-page.component.ts`.
- API via props `shellApi`/`shellContext` e evento `creditoAction`. Fonte: `remote-credito/src/app/credito-element.component.ts`.

## Menu
- Menu publicado em `public/menu.json`. Fonte: `remote-credito/public/menu.json`.
- `menuPath` e configuravel no host. Fonte: `host-shell/public/config.json`.

## Rotas de exemplo
- `/credito`
- `/credito/analise`
- `/credito/painel`

Fonte: `host-shell/src/app/app.routes.ts`.
