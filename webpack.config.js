const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
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
    BASE_HOST: JSON.stringify(process.env.BASE_HOST === undefined ? 'http://localhost:3000' : process.env.BASE_HOST),
    SOCKET_URL: JSON.stringify(process.env.SOCKET_URL || 'http://localhost:3001'),
  }),
  new MiniCssExtractPlugin({
    filename: isDev ? '[name].css' : '[name]-[contenthash].css',
    chunkFilename: isDev ? '[id].css' : '[id]-[hash].css',
  }),
];

const rules = [
  {
    test: /\.(t|j)sx?$/,
    use: ['babel-loader'],
  },
  {
    test: /\.s?css$/,
    use: [
      {
        loader: MiniCssExtractPlugin.loader,
        options: {
          hmr: isDev,
          reloadAll: true,
        },
      },
      { loader: 'css-loader' },
      { loader: 'postcss-loader' },
      {
        loader: 'sass-loader',
      },
    ],
  },
  {
    test: /\.(jpg|jpeg|png|woff|woff2|eot|ttf|svg)$/,
    loader: 'url-loader?limit=8192',
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
    new OptimizeCSSAssetsPlugin({}),
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
