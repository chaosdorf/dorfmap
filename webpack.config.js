// @flow
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const nodeEnv = (process.env.NODE_ENV || 'development').trim();

// eslint-disable-next-line
const __DEV__ = nodeEnv !== 'production';

const devtool = __DEV__ ? '#source-map' : '';

const plugins = [
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(nodeEnv),
    },
    __DEV__: JSON.stringify(__DEV__),
    BASE_HOST: JSON.stringify(process.env.BASE_HOST === undefined ? 'http://localhost:3000' : process.env.BASE_HOST),
    PRIMUS: JSON.stringify(process.env.PRIMUS || 'http://localhost:3001'),
  }),
  new HtmlWebpackPlugin({
    filename: 'index.html',
    template: 'html-loader!src/index.html',
    minify: {},
  }),
];

if (!__DEV__) {
  const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

  plugins.push(
    ...[
      new UglifyJsPlugin({
        uglifyOptions: {
          output: {
            comments: false,
          },
        },
      }),
    ]
  );
}

function StyleLoader(prod, scss) {
  const loader = [
    'style-loader',
    {
      loader: 'css-loader',
      options: {
        modules: true,
        importLoaders: scss ? 2 : 1,
        localIdentName: prod ? undefined : '[path][name]__[local]',
      },
    },
    'postcss-loader',
  ];

  if (scss) {
    loader.push('sass-loader');
  }

  return loader;
}

module.exports = {
  mode: __DEV__ ? 'development' : 'production',
  context: __dirname,
  resolve: {
    // Extension die wir weglassen können
    extensions: ['.js', '.jsx'],
    modules: [path.resolve('src'), 'node_modules'],
    alias: {
      'lodash-es': 'lodash',
    },
  },
  entry: ['./src/main.js'],
  output: {
    path: path.resolve('public'),
    filename: 'dorfmap-[hash].js',
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|primusClient)/,
        loader: 'babel-loader',
        query: { cacheDirectory: true },
      },
      { test: /\.pdf$/, loader: 'file-loader' },
      { test: /\.(eot|ttf|otf|svg|woff2?)(\?.*)?$/, loader: 'file-loader' },
      { test: /\.(jpg|png|gif|jpeg|ico)$/, loader: 'url-loader' },
      { test: /\.json$/, loader: 'json-loader' },
      {
        test: /\.css$/,
        use: StyleLoader(!__DEV__, false),
      },
      {
        test: /\.scss/,
        use: StyleLoader(!__DEV__, true),
      },
    ],
  },
  plugins,
  devtool,
};
