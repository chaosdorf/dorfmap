import { createHistory } from 'history';
import { Router, Route } from 'react-router';
import App from './Components/App';
import React from 'react';

export default (
  <Router history={createHistory()}>
    <Route path="/" component={App}/>
  </Router>
);
