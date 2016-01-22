/* @flow */
import './vendor.js';
import ReactDOM from 'react-dom';
import routes from './routes.js';
import taps from 'react-tap-event-plugin';
import './primus';


taps();


setTimeout(() => {
  ReactDOM.render(routes, document.querySelector('#dorfmapWrapper'));
}, 500);
