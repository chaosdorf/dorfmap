// @flow
import './cxsRender';
import './primus';
import './axiosDefaults';
import * as React from 'react';
import App from './Components/App';
import injectTapEventPlugin from 'react-tap-event-plugin';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import ReactDOM from 'react-dom';

require('rc-tooltip/assets/bootstrap.css');

injectTapEventPlugin();

ReactDOM.render(
  <MuiThemeProvider>
    <App />
  </MuiThemeProvider>,
  // $FlowFixMe
  document.querySelector('#dorfmapWrapper')
);
