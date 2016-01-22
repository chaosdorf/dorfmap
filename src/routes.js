/* @flow */
import { Router, Route, browserHistory } from 'react-router';
import App from './Components/App';
import React from 'react';

export default (
  <Router history={browserHistory}>
    <Route path="/" component={App}/>
  </Router>
);
