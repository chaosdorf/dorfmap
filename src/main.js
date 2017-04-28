// @flow
import 'react-hot-loader/patch';
import './vendor.js';
import App from './Components/App';
import React from 'react';
import ReactDOM from 'react-dom';
import './primus';
import { AppContainer } from 'react-hot-loader';

setTimeout(() => {
  ReactDOM.render(
    <AppContainer><App /></AppContainer>,
    document.querySelector('#dorfmapWrapper')
  );
}, 500);

if (module.hot) {
  // $FlowFixMe
  module.hot.accept('./Components/App', () => {
    const App = require('./Components/App').default;

    ReactDOM.render(
      <AppContainer><App /></AppContainer>,
      document.querySelector('#dorfmapWrapper')
    );
  });
}
