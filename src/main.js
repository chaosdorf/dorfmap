import './vendor.js';
import React from 'react';
import Router from 'react-router';
import routes from './routes.js';
import taps from 'react-tap-event-plugin';
import {RouteHandler} from 'react-router';
taps();

class App extends React.Component {
  render() {
    return (
      <RouteHandler/>
    );
  }
}

Router.run(routes, Router.HashLocation, (App) => {
  React.render(<App/>, document.body);
});
