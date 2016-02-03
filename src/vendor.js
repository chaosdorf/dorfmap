/* @flow */
import 'babel-regenerator-runtime';
import './babelHelper.js';
import axios from 'axios';
import { baseHost } from 'config';

axios.interceptors.request.use(config => {
  config.url = `${baseHost}${config.url}`;
  return config;
});

axios.interceptors.response.use(response => response.data);

global.Promise = require('bluebird');
require('material-design-iconfont/style.css');
require('rc-tooltip/assets/bootstrap.css');
