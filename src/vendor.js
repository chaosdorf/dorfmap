/* @flow */
/* $FlowFixMe */
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
/* $FlowFixMe */
require('material-design-iconfont/style.css');
/* $FlowFixMe */
require('rc-tooltip/assets/bootstrap.css');
