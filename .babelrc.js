module.exports = {
  parserOpts: {
    plugins: [['flow', { all: true }]],
  },
  presets: [
    [
      '@babel/preset-env',
      {
        loose: false,
        useBuiltIns: 'entry',
        modules: false,
      },
    ],
    '@babel/preset-react',
    '@babel/preset-flow',
    'babel-preset-joblift',
  ],
  plugins: [
    'lodash',
    [
      'module-resolver',
      {
        root: 'app',
      },
    ],
  ],
  env: {
    development: {
      plugins: ['@babel/plugin-transform-react-jsx-source'],
    },
    production: {
      plugins: ['@babel/plugin-transform-react-constant-elements'],
    },
  },
};
