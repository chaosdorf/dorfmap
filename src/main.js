// @flow
import './cxsRender';
import './vendor.js';
import './primus';
import App from './Components/App';
import injectTapEventPlugin from 'react-tap-event-plugin';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import * as React from 'react';
import ReactDOM from 'react-dom';

injectTapEventPlugin();

ReactDOM.render(
  <MuiThemeProvider>
    <App />
  </MuiThemeProvider>,
  document.querySelector('#dorfmapWrapper')
);
