// @flow
import BluebirdPromise from 'bluebird';

declare var __DEV__: boolean;
declare var BASE_HOST: string;
declare var PRIMUS: string;
declare var Promise: BluebirdPromise;

declare module 'ModuleStub' {
  declare module.exports: any;
}
