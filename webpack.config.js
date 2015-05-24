var path = require('path');
var webpack = require('webpack');
module.exports = {
  eslint: {
    configFile: './.eslintrc',
    failOnWarning: true,
    failOnError: true
  },
  context: __dirname,
  entry: [
    './src/main.js'
  ],
  output: {
    path: path.resolve('public'),
    filename: 'app.js',
    publicPath: ''
  },
  module: {
    loaders: [
      { test: /\.less$/, loader: 'style!css!autoprefixer?browsers=last 2 version!less' },
      { test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel-loader?stage=0&optional=runtime!eslint', include: path.join(__dirname, 'src')},
      { test: /\.(jpg|png|gif)$/, loader: 'file!image' },
      { test: /\.woff2?(\?v=.*)?$/, loader: 'url?limit=10000&minetype=application/font-woff' },
      { test: /\.(eot|ttf|svg|otf)(\?v=.*)?$/, loader: 'url' },
      { test: /\.json$/, loader: 'json' }
    ]
  },
  plugins: [
    new webpack.NoErrorsPlugin()
  ]
};
