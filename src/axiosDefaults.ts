import axios from 'axios';

axios.interceptors.request.use((config) => {
  config.url = `${
    // @ts-ignore
    // eslint-disable-next-line no-undef
    BASE_HOST === undefined ? 'http://localhost:3000' : BASE_HOST
  }${config.url}`;

  return config;
});
