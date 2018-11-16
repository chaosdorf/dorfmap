module.exports = {
  extends: ['joblift/base', 'joblift/flowtype', 'joblift/react'],
  parser: 'babel-eslint',
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
