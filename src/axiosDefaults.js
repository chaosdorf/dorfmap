// @flow
import axios from 'axios';

axios.interceptors.request.use(config => {
  // $FlowFixMe
  config.url = `${BASE_HOST === undefined ? 'http://localhost:3000' : BASE_HOST}${config.url}`;

  return config;
});
