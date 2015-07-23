import './vendor.js';
import {RouteHandler} from 'react-router';
import Router from 'react-router';
import routes from './routes.js';
import React from 'react';
import taps from 'react-tap-event-plugin';
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
