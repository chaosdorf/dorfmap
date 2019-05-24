// @ts-ignore
window.console = window.console || {};
const methods = [
  'debug',
  'error',
  'info',
  'log',
  'warn',
  'dir',
  'dirxml',
  'table',
  'trace',
  'group',
  'groupCollapsed',
  'groupEnd',
  'clear',
  'count',
  'countReset',
  'assert',
  'profile',
  'profileEnd',
  'time',
  'timeLog',
  'timeEnd',
  'timeStamp',
  'context',
  'memory',
];

const noop = () => {};

for (const m of methods) {
  // @ts-ignore
  window.console[m] = window.console[m] || noop;
}
