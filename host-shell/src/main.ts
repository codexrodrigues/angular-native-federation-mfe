import { initFederation } from '@angular-architects/native-federation';
import { loadRuntimeConfig } from './app/runtime-config';

loadRuntimeConfig()
  .then((config) => initFederation(config.manifestUrl))
  .catch((err) => console.error(err))
  .then(() => import('./bootstrap'))
  .catch((err) => console.error(err));
