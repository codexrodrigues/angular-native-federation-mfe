const { withNativeFederation, shareAll, shareAngularLocales } = require('@angular-architects/native-federation/config');
const ngCommonPkg = require('@angular/common/package.json');

const angularSingleton = { singleton: true, strictVersion: false, requiredVersion: 'auto' };
const strictSingleton = { singleton: true, strictVersion: true, requiredVersion: 'auto' };
const sharedUiSingleton = { singleton: true, strictVersion: true, requiredVersion: 'auto' };

module.exports = withNativeFederation({

  shared: {
    ...shareAll({ singleton: true, strictVersion: false, requiredVersion: 'auto' }),
    ...shareAngularLocales(['pt'], {
      packageInfo: {
        entryPoint: 'node_modules/@angular/common/locales/pt.js',
        version: ngCommonPkg.version,
        esm: true
      }
    }),
    '@angular/animations': angularSingleton,
    '@angular/common': angularSingleton,
    '@angular/core': angularSingleton,
    '@angular/forms': angularSingleton,
    '@angular/platform-browser': angularSingleton,
    '@angular/router': angularSingleton,
    '@angular/material': angularSingleton,
    '@angular/cdk': angularSingleton,
    rxjs: strictSingleton,
    'shared-ui-lib': sharedUiSingleton,
    'shared-logic': { singleton: true, strictVersion: true, requiredVersion: 'auto' }
  },

  features: {
    ignoreUnusedDeps: true
  },

  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
    // Add further packages you don't need at runtime
  ]

  // Please read our FAQ about sharing libs:
  // https://shorturl.at/jmzH0
  
});
