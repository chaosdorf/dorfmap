const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const node_env = (process.env.NODE_ENV || 'development').trim();
const DashboardPlugin = require('webpack-dashboard/plugin');

const __DEV__ = node_env !== 'production';

const devtool = __DEV__ ? '#source-map' : '';

const plugins = [
  new webpack.NoErrorsPlugin(),
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(node_env)
    },
    __DEV__: JSON.stringify(__DEV__),
    BASE_HOST: JSON.stringify(process.env.BASE_HOST === undefined ? 'http://localhost:3000' : process.env.BASE_HOST),
    PRIMUS: JSON.stringify(process.env.PRIMUS || 'http://localhost:3001'),
    SENTRY_DSN: JSON.stringify(process.env.SENTRY_DSN || ''),
    SENTRY_ENV: JSON.stringify(process.env.SENTRY_ENV || ''),
  }),
  new webpack.OldWatchingPlugin(),
  new HtmlWebpackPlugin({
    filename: 'index.html',
    template: 'html!src/index.html',
    minify: {},
  }),
];

let preLoaders;

if (__DEV__) {
  preLoaders = [
    {
      test: /.jsx?$/,
      loader: 'eslint',
      exclude: /node_modules|dependency/,
    },
  ];
  plugins.push(new HardSourceWebpackPlugin({
    cacheDirectory: path.resolve('cache'),
    recordsPath: path.resolve('cache/records.json'),
    environmentPaths: {
      root: process.cwd(),
      directories: ['node_modules'],
      files: ['package.json', 'webpack.config.js'],
    }
  }));
  plugins.push(new DashboardPlugin());
} else {
  plugins.push(new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false,
    },
    output: {
      comments: false,
    },
    screwIe8: true,
    sourceMap: false,
  }));
}

module.exports = {
  eslint: {
    configFile: './src/.eslintrc.js',
    failOnWarning: false,
    failOnError: true,
  },
  context: __dirname,
  resolve: {
    //Extension die wir weglassen können
    extensions: ['', '.js', '.jsx', '.json'],
    root: [
      path.resolve('src'),
    ],
    alias: {
      bluebird: 'bluebird/js/browser/bluebird.min.js',
    },
  },
  entry: './src/main.js',
  output: {
    path: 'public',
    filename: 'dorfmap-[hash].js',
    publicPath: '/',
  },
  module: {
    preLoaders,
    loaders: [
      { test: /\.jsx?$/,
        exclude: /(node_modules|primusClient)/,
        loader: 'babel',
        query: { cacheDirectory: true },
      },
      { test: /\.(CSS|css)\.js$/,
        exclude: /(node_modules)/,
        loader: 'inline-css',
      },
      { test: /\.pdf$/, loader: 'file' },
      { test: /\.(eot|ttf|otf|svg|woff2?)(\?.*)?$/, loader: 'file' },
      { test: /\.(jpg|png|gif|jpeg|ico)$/, loader: 'url' },
      { test: /\.json$/, loader: 'json' },
      { test: /\.css$/, loader: 'style!css' },
    ],
    noParse: [
      /primusClient\.js/,
      /.*primusClient.*/,
      /react\\dist\\react(-with-addons)?\.js/,
    ],
  },
  plugins,
  devtool,
};
