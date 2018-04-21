// @flow
import axios from 'axios';

axios.interceptors.request.use(config => {
  // $FlowFixMe
  config.url = `${process.env.BASE_HOST === undefined ? 'http://localhost:3000' : process.env.BASE_HOST}${config.url}`;

  return config;
});
