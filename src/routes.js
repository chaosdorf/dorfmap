import { createHistory } from 'history';
import { Router, Route } from 'react-router';
import Dorfmap from './Components/Dorfmap.jsx';
import React from 'react';

export default (
  <Router history={createHistory()}>
    <Route path="/" component={Dorfmap}/>
  </Router>
);
