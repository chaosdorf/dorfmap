import 'core-js';
import 'regenerator-runtime/runtime';

const polyfills = [];

if (!window.console) {
  // @ts-ignore
  polyfills.push(import('./consolePolyfill'));
}

if (!window.fetch) {
  // @ts-ignore
  polyfills.push(import('whatwg-fetch'));
}

if (!window.requestAnimationFrame) {
  // @ts-ignore
  polyfills.push(import('raf/polyfill'));
}

Promise.all(polyfills).then(() => {
  require('./main');
});
