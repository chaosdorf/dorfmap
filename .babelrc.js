module.exports = {
  presets: [
    '@babel/preset-typescript',
    [
      '@babel/preset-env',
      {
        loose: true,
        useBuiltIns: 'entry',
        modules: false,
        corejs: 3,
      },
    ],
    '@babel/preset-react',
  ],
  plugins: [
    '@babel/plugin-transform-react-constant-elements',
    [
      'module-resolver',
      {
        root: 'src',
      },
    ],
  ],
};
