const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const isDev = process.env.NODE_ENV !== 'production';

const plugins = [
  new HtmlWebpackPlugin({
    template: path.resolve(__dirname, 'src/index.html'),
    minifiy: !isDev,
  }),
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
    },
    __DEV__: JSON.stringify(isDev),
    BASE_HOST: JSON.stringify(
      process.env.BASE_HOST === undefined
        ? 'http://localhost:3000'
        : process.env.BASE_HOST
    ),
    SOCKET_URL: JSON.stringify(
      process.env.SOCKET_URL || 'http://localhost:3001'
    ),
  }),
];

const rules = [
  {
    test: /\.(t|j)sx?$/,
    use: ['babel-loader'],
  },
  {
    test: /\.(jpg|jpeg|png|woff|woff2|eot|ttf|svg)$/,
    loader: 'url-loader',
    options: {
      limit: 8192,
    },
  },
];

const optimization = {};

if (isDev) {
  rules[0].use.unshift('cache-loader');
} else {
  optimization.minimizer = [
    new TerserPlugin({
      parallel: true,
      extractComments: {
        condition: 'all',
        banner: () => '',
      },
    }),
  ];
}

module.exports = {
  optimization,
  plugins,
  mode: isDev ? 'development' : 'production',
  devtool: isDev ? 'cheap-module-eval-source-map' : false,
  entry: {
    dorfmap: ['./src/index.ts'],
  },
  resolve: {
    modules: ['node_modules', path.resolve(__dirname, 'src')],
    extensions: ['.js', '.json', '.jsx', '.ts', '.tsx'],
    alias: {
      'lodash-es$': 'lodash',
    },
  },
  output: {
    path: path.resolve('public'),
    filename: 'dorfmap-[hash].js',
    publicPath: '/',
  },
  module: {
    rules,
  },
  devServer: {
    contentBase: path.resolve(__dirname, 'public'),
    historyApiFallback: true,
    inline: true,
    hot: true,
  },
};
