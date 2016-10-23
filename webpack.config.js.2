const nodeEnv = process.env.NODE_ENV || 'development';
const __DEV__ = nodeEnv !== 'production';

const config = require('@terse/webpack').api()
.entry('./src/main.js')
.plugin('webpack.NoErrorsPlugin')
.plugin('webpack.DefinePlugin', {
  'process.env': {
    NODE_ENV: JSON.stringify(nodeEnv)
  },
  __DEV__: JSON.stringify(__DEV__),
  BASE_HOST: JSON.stringify(process.env.BASE_HOST === undefined ? 'http://localhost:3000' : process.env.BASE_HOST),
  PRIMUS: JSON.stringify(process.env.PRIMUS || 'http://localhost:3001'),
  SENTRY_DSN: JSON.stringify(process.env.SENTRY_DSN || ''),
  SENTRY_ENV: JSON.stringify(process.env.SENTRY_ENV || ''),
})
.plugin('html-webpack-plugin', {
  filename: 'index.html',
  template: 'src/index.html',
  minify: {},
})
.modules('src')
.alias('bluebird', 'bluebird/js/browser/bluebird.min.js')
.output({
  path: 'public',
  filename: 'dorfmap-[hash].js',
  publicPath: '/',
})
.target('web')
.when('development', api => api
.preLoader('eslint', '.jsx?', {
  exclude: /node_modules/,
})
.sourcemap('#source-map')
)
.when('production', api => api
.plugin('webpack.LoaderOptionsPlugin', {
  minimize: true,
  debug: false,
})
.plugin('webpack.optimize.UglifyJsPlugin', {
  compress: {
    warnings: false,
  },
  output: {
    comments: false,
  },
  screwIe8: true,
  sourceMap: false,
})
)
.getConfig();

if (process.env.DASHBOARD) {
  const Dashboard = require('webpack-dashboard');
  const DashboardPlugin = require('webpack-dashboard/plugin');

  const dashboard = new Dashboard();
  config.plugins.push(new DashboardPlugin(dashboard.setData));
}

config.eslint = {
  configFile: './src/.eslintrc.js',
  failOnWarning: false,
  failOnError: true,
};
config.resolve.extensions = ['', '.js', '.jsx', '.json'];
config.module.loaders = [
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
  { test: /\.less/, loader: 'style!css!less' },
];
config.module.noParse = [
  /primusClient\.js/,
];
module.exports = config;
