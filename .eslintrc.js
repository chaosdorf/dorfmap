module.exports = {
  extends: ['joblift/2space', 'joblift/flowtype', 'joblift/react'],
  env: {
    browser: true,
    node: true,
  },
  globals: {
    __DEV__: false,
    BASE_HOST: false,
    PRIMUS: false,
    SENTRY: false,
  },
  rules: {
    'no-use-before-define': 0,
    'no-shadow': 0,
  },
};
