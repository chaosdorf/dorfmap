// @ƒlow
import 'babel-polyfill';

const polyfills = [];

if (!window.fetch) {
  polyfills.push(import('whatwg-fetch'));
}

if (!window.requestAnimationFrame) {
  polyfills.push(import('raf/polyfill'));
}

Promise.all(polyfills).then(() => {
  require('./main');
});
