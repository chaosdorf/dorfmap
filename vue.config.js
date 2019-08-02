const webpack = require('webpack');

module.exports = {
  productionSourceMap: false,
  publicPath: '/static',
  devServer: {
    proxy: {
      '^/ajax': {
        target: 'http://localhost:3000',
        headers: {
          'cache-control': 'no-cache',
        },
      },
      '^/action': {
        target: 'http://localhost:3000',
        headers: {
          'cache-control': 'no-cache',
        },
      },
      '^/status': {
        target: 'http://localhost:3000',
        headers: {
          'cache-control': 'no-cache',
        },
      },
    },
  },
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        SOCKET_URL: JSON.stringify(
          process.env.SOCKET_URL || 'http://localhost:3001'
        ),
      }),
    ],
  },
};
