// @flow
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const nodeEnv = (process.env.NODE_ENV || 'development').trim();
const DashboardPlugin = require('webpack-dashboard/plugin');

const __DEV__ = nodeEnv !== 'production';

const devtool = __DEV__ ? '#source-map' : '';

const plugins = [
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(nodeEnv),
    },
    __DEV__: JSON.stringify(__DEV__),
    BASE_HOST: JSON.stringify(
      process.env.BASE_HOST === undefined
        ? 'http://localhost:3000'
        : process.env.BASE_HOST
    ),
    PRIMUS: JSON.stringify(process.env.PRIMUS || 'http://localhost:3001'),
    SENTRY_DSN: JSON.stringify(process.env.SENTRY_DSN || ''),
    SENTRY_ENV: JSON.stringify(process.env.SENTRY_ENV || ''),
  }),
  new HtmlWebpackPlugin({
    filename: 'index.html',
    template: 'html-loader!src/index.html',
    minify: {},
  }),
];

if (__DEV__) {
  plugins.push(new DashboardPlugin());
} else {
  plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
      output: {
        comments: false,
      },
      screwIe8: true,
      sourceMap: false,
    })
  );
}

module.exports = {
  context: __dirname,
  resolve: {
    //Extension die wir weglassen können
    extensions: ['.js', '.jsx'],
    modules: [path.resolve('src'), 'node_modules'],
    alias: {
      bluebird: 'bluebird/js/browser/bluebird.min.js',
    },
  },
  entry: './src/main.js',
  output: {
    path: path.resolve('public'),
    filename: 'dorfmap-[hash].js',
    publicPath: '/',
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /.jsx?$/,
        loader: 'eslint-loader',
        include: [path.resolve(__dirname, 'src')],
        exclude: /(.*\.config.*|.*node_modules.*|.*inferno.*)/,
      },
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|primusClient)/,
        loader: 'babel-loader',
        query: { cacheDirectory: true },
      },
      {
        test: /\.(CSS|css)\.js$/,
        exclude: /(node_modules)/,
        loader: 'inline-css-loader',
      },
      { test: /\.pdf$/, loader: 'file-loader' },
      { test: /\.(eot|ttf|otf|svg|woff2?)(\?.*)?$/, loader: 'file-loader' },
      { test: /\.(jpg|png|gif|jpeg|ico)$/, loader: 'url-loader' },
      { test: /\.json$/, loader: 'json-loader' },
      { test: /\.css$/, loader: 'style-loader!css-loader' },
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
