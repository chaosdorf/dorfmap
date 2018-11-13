module.exports = {
  extends: ['joblift', 'joblift/2space'],
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  globals: {
    __DEV__: false,
    BASE_HOST: false,
    SOCKET_URL: false,
    SENTRY: false,
  },
  rules: {
    'no-use-before-define': 0,
    'no-shadow': 0,
  },
};
