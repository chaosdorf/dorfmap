// @flow
import 'babel-polyfill';
import axios from 'axios';

axios.interceptors.request.use(config => {
  config.url = `${BASE_HOST}${config.url}`;
  return config;
});

global.Promise = require('bluebird');
require('rc-tooltip/assets/bootstrap.css');
