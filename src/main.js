// @flow
import './vendor.js';
import App from './Components/App';
import './cxsRender';
import React from 'react';
import ReactDOM from 'react-dom';
import './primus';
import injectTapEventPlugin from 'react-tap-event-plugin';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

injectTapEventPlugin();

ReactDOM.render(
  <MuiThemeProvider><App /></MuiThemeProvider>,
  document.querySelector('#dorfmapWrapper')
);
