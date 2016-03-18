var HtmlWebpackPlugin = require('html-webpack-plugin');

var path = require('path');
const process = require('process');
var webpack = require('webpack');
var fs = require('fs');

var node_env = process.env.NODE_ENV || 'development';
if (!fs.existsSync(`./src/config.${node_env}.js`)) {
  node_env = 'development';
}
const configPath = `config.${node_env}.js`;

var plugins = [
  new webpack.NoErrorsPlugin(),
  new HtmlWebpackPlugin({
    template: './src/index.html',
    minify: {}
  }),
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(node_env)
    },
    IS_PRODUCTION: JSON.stringify(node_env === 'production'),
    CONFIGPATH: JSON.stringify(configPath),
  }),
];

if (node_env === 'production') {
  plugins.push(
    new webpack.optimize.UglifyJsPlugin()
  );
}

var alias = {
  eventemitter: 'eventemitter3',
  bluebird: 'bluebird/js/browser/bluebird.min.js',
};
var config = path.resolve('src/config.' + node_env + '.js');
alias.config = config;

module.exports = {
  devtool: node_env === 'production' ? undefined : 'cheap-module-source-map',
  eslint: {
    configFile: './src/.eslintrc',
    failOnWarning: false,
    failOnError: true
  },
  context: __dirname,
  resolve: {
    extensions: ['', '.js', '.jsx', '.json'],
    alias,
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
      { test: /\.css$/, loader: 'style!css' },
      { test: /\.CSS.js$/, exclude: /(node_modules|dependency)/, loader: 'inline-css!babel' },
      { test: /^((?!CSS\.js$).)*(\.jsx?)$/,
        exclude: /(node_modules|external)/,
        loader: 'babel!eslint',
      },
      { test: /\.(jpg|png|gif)$/, loader: 'file!image' },
      { test: /\.woff2?(\?v=.*)?$/, loader: 'url?limit=10000&minetype=application/font-woff' },
      { test: /\.(eot|ttf|svg|otf)(\?v=.*)?$/, loader: 'url' },
      { test: /\.json$/, loader: 'json' }
    ],
    noParse: [
      /primusClient\.js/,
    ],
  },
  plugins,
};
