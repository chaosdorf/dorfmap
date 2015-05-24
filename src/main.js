import './vendor.js';
import { routes } from './config.js';
import Router from 'react-router';


global.router = Router.run(routes, Router.HistoryLocation, Handler => {
  React.render(<Handler/>, document.body);
});
