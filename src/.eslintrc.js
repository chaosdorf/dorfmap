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
  rules: {
    'generator-star-spacing': 0,
    'import/prefer-default-export': 0,
    'react/jsx-no-bind': 0,
  },
};
