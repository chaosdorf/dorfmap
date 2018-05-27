// @flow
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

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
    BASE_HOST: JSON.stringify(process.env.BASE_HOST === undefined ? 'http://localhost:3000' : process.env.BASE_HOST),
    PRIMUS: JSON.stringify(process.env.PRIMUS || 'http://localhost:3001'),
  }),
];

const optimization = {};

const rules = [
  {
    test: /\.jsx?$/,
    use: ['babel-loader'],
  },
  {
    test: /\.s?css$/,
    use: [
      {
        loader: isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
      },
      { loader: 'css-loader' },
      { loader: 'postcss-loader' },
      { loader: 'sass-loader' },
    ],
  },
];

if (isDev) {
  plugins.push(...[new webpack.HotModuleReplacementPlugin()]);
  rules.forEach(r => {
    if (r.use && Array.isArray(r.use)) {
      r.use.unshift({
        loader: 'cache-loader',
      });
    }
  });
} else {
  plugins.push(
    ...[
      new MiniCssExtractPlugin({
        filename: '[name]-[hash].css',
        chunkFilename: '[id]-[hash].css',
      }),
    ]
  );
  optimization.minimizer = [
    new UglifyJsPlugin({
      cache: true,
      parallel: true,
      extractComments: true,
    }),
    new OptimizeCSSAssetsPlugin({}),
  ];
}

module.exports = {
  optimization,
  plugins,
  mode: isDev ? 'development' : 'production',
  devtool: isDev ? 'source-map' : false,
  entry: {
    dorfmap: './src/main.jsx',
  },
  resolve: {
    modules: ['node_modules', path.resolve(__dirname, 'src')],
    extensions: ['.js', '.json', '.jsx'],
    symlinks: true,
    alias: {
      'lodash-es': 'lodash',
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
    //   proxy: {
    //     '/api': {
    //       target: 'http://localhost:9042',
    //     },
    //   },
  },
};
