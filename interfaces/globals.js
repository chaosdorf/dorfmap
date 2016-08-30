import BluebirdPromise from 'bluebird';

declare var __DEV__: bool;
declare var BASE_HOST: string;
declare var PRIMUS: string;
declare var SENTRY_DSN: string;
declare var SENTRY_ENV: string;
declare var Promise: BluebirdPromise;


declare module 'ModuleStub' {
  declare module.exports: any;
}
