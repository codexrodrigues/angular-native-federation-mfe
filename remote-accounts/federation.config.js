const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

const angularSingleton = { singleton: true, strictVersion: false, requiredVersion: 'auto' };
const strictSingleton = { singleton: true, strictVersion: true, requiredVersion: 'auto' };
const sharedUiSingleton = { singleton: true, strictVersion: true, requiredVersion: 'auto' };

module.exports = withNativeFederation({

  name: 'remote-accounts',

  exposes: {
    './Routes': './src/app/accounts.routes.ts',
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: false, requiredVersion: 'auto' }),
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
