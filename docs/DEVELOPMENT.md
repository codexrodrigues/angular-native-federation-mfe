# Desenvolvimento

## Setup local
Este repo nao usa um workspace unico; cada app/lib tem seu proprio `package.json`. Fontes: `host-shell/package.json`, `remote-sales/package.json`, `shared-logic/package.json`.

### Build + serve (dist) para demo
- Windows: `./start-demo.ps1`
- macOS/Linux: `./start-demo.sh` (use `--serve` para subir os servers)

O script:
1) builda `shared-logic` e gera tarball em `releases/`
2) builda `shared-ui-lib`
3) instala deps em host/remotes
4) builda host/remotes
5) sobe `http-server` nos dist (opcional no .sh)

Fontes: `start-demo.ps1`, `start-demo.sh`.

### Dev servers (ng serve)
Em dev, rode cada app em um terminal:

Host:
```bash
cd host-shell
npm run start
```
Porta: 4200 (`host-shell/angular.json`).

Remotes federados:
```bash
cd remote-sales
npm run start
```
Porta: 4201 (`remote-sales/angular.json`).

```bash
cd remote-gde
npm run start
```
Porta: 4202 (`remote-gde/angular.json`).

```bash
cd remote-accounts
npm run start
```
Porta: 4203 (`remote-accounts/angular.json`).

Web component (Credito):
```bash
cd remote-credito
npm run build:element
npm run serve:element
```
Porta: 4304 (`remote-credito/package.json`).

## Runtime config local
O host carrega `config.json` em runtime e pode ser sobrescrito por `window.__HOST_SHELL_CONFIG__`. Fontes: `host-shell/src/app/runtime-config.ts`, `host-shell/public/config.json`.

Exemplo de override em runtime (devtools):
```js
window.__HOST_SHELL_CONFIG__ = {
  manifestUrl: 'federation.manifest.json',
  remotes: {
    'remote-sales': 'http://localhost:4201/remoteEntry.json'
  },
  webComponents: {
    'remote-credito': {
      baseUrl: 'http://localhost:4304/browser/',
      menuPath: 'menu.json'
    }
  }
};
```

## Testar integracao
- Menu remoto: verifique `public/menu.json` e a carga no sidebar. Fontes: `remote-sales/public/menu.json`, `host-shell/src/app/app.component.ts`.
- Metadata e status: valide `public/remote-info.json`. Fontes: `remote-gde/public/remote-info.json`, `host-shell/src/app/app.component.ts`.
- Drawer remoto (GDE): teste o fluxo de drawer via `ShellApi`. Fontes: `host-shell/src/app/shell-api/shell-api.service.ts`, `host-shell/src/app/shell-api/drawer-registry.ts`.
- Credito (web component): confirmar handshake com `remote-info.json` e execucao de scripts. Fonte: `host-shell/src/app/credito-element/credito-element-page.component.ts`.

## Simular Shell API
O web component expoe eventos `creditoAction` e aceita `shellApi` e `shellContext`. Para simular fora do host, crie uma pagina simples que injete essas props (a confirmar). Fonte: `remote-credito/src/app/credito-element.component.ts`.

## Boas praticas
- Evite imports diretos entre apps; use contratos em `shared-logic`. Fonte: `shared-logic/src/core.ts`.
- Mantenha `shared-ui-lib` como peer dependency e compartilhe via federation. Fonte: `shared-ui-lib/package.json`, `remote-sales/federation.config.js`.
- Ajuste `strictVersion` conscientemente; prefira `true` para contratos criticos. Fonte: `host-shell/federation.config.js`.
- Publique `menu.json` e `remote-info.json` junto com o build. Fonte: `remote-accounts/public`.
