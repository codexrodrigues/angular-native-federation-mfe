# Cache Headers for Native Federation

This repo relies on runtime federation, so caching must keep the manifest and remote entry fresh while
allowing long cache for hashed assets.

Files and suggested cache-control:
- `host-shell/public/federation.manifest.json`: `no-store, max-age=0`
- `host-shell/public/config.json`: `no-store, max-age=0`
- `remote-*/remoteEntry.json`: `no-cache, must-revalidate, max-age=0`
- `remote-*/public/menu.json`: `no-cache, max-age=60` (or `no-store` if menus are dynamic)
- Hashed assets (JS/CSS/images under `dist/**`): `public, max-age=31536000, immutable`

## Nginx example
```nginx
location = /federation.manifest.json {
  add_header Cache-Control "no-store, max-age=0";
}

location = /config.json {
  add_header Cache-Control "no-store, max-age=0";
}

location = /remoteEntry.json {
  add_header Cache-Control "no-cache, must-revalidate, max-age=0";
}

location = /menu.json {
  add_header Cache-Control "no-cache, max-age=60";
}

location / {
  add_header Cache-Control "public, max-age=31536000, immutable";
}
```

## CDN notes
- For CloudFront/S3 or similar, apply the same policy using path-based behaviors.
- Keep `federation.manifest.json` and `remoteEntry.json` out of long caches to avoid stale deployments.
