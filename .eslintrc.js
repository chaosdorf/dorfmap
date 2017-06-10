module.exports = {
  extends: 'marudor',
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
  plugins: ['sort-imports-es6-autofix'],
  rules: {},
};
