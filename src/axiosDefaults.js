// @flow
import axios from 'axios';

axios.interceptors.request.use(config => {
  config.url = `${BASE_HOST}${config.url}`;

  return config;
});
