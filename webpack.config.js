var path = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');

var node_env = process.env.NODE_ENV || 'development';

var plugins = [
new webpack.NoErrorsPlugin(),
new HtmlWebpackPlugin({
  template: './src/index.html',
  title: 'Dorfmap',
  minify: true
}),
new webpack.DefinePlugin({
  'process.env': {
    NODE_ENV: JSON.stringify(node_env)
  }
})
];

var alias = {
  eventemitter: 'eventemitter3'
};
var config = path.resolve('src/config.' + node_env + '.js');
alias.config = config;

module.exports = {
  eslint: {
    configFile: './src/.eslintrc',
    failOnWarning: true,
    failOnError: true
  },
  context: __dirname,
  resolve: {
    alias: alias,
    root: path.resolve('src')
  },
  entry: [
  './src/main.js'
  ],
  output: {
    path: path.resolve('public'),
    filename: 'app-[hash].js',
    publicPath: ''
  },
  module: {
    loaders: [
    { test: /\.less$/, loader: 'style!css!autoprefixer?browsers=last 2 version!less' },
    { test: /\.jsx?$/, exclude: /(node_modules|bower_components)/, loader: 'react-hot!babel-loader?stage=0&cacheDirectory&optional[]=runtime!eslint'},
    { test: /\.(jpg|png|gif)$/, loader: 'file!image' },
    { test: /\.woff2?(\?v=.*)?$/, loader: 'url?limit=10000&minetype=application/font-woff' },
    { test: /\.(eot|ttf|svg|otf)(\?v=.*)?$/, loader: 'url' },
    { test: /\.json$/, loader: 'json' }
    ]
  },
  plugins: plugins
};
