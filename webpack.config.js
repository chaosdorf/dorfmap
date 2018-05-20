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
];

const optimization = {};

if (isDev) {
  plugins.push(...[new webpack.HotModuleReplacementPlugin()]);
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
    }),
    new OptimizeCSSAssetsPlugin({}),
  ];
}

module.exports = {
  optimization,
  plugins,
  mode: isDev ? 'development' : 'production',
  devtool: isDev ? 'source-map' : false,
  entry: './src/main.jsx',
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
    rules: [
      {
        test: /\.jsx?$/,
        use: ['cache-loader', 'babel-loader'],
      },
      {
        test: /\.s?css$/,
        use: [
          { loader: 'cache-loader' },
          {
            loader: isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          },
          { loader: 'css-loader' },
          { loader: 'postcss-loader' },
          { loader: 'sass-loader' },
        ],
      },
    ],
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
