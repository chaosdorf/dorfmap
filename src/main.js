// @flow
import './axiosDefaults';
import * as React from 'react';
import { applyMiddleware, compose, createStore } from 'redux';
import { Provider } from 'react-redux';
import App from './Components/App';
import promiseMiddleware from 'redux-promise';
import ReactDOM from 'react-dom';
import reducer from './reducers';

const middlewares = [promiseMiddleware];

if (process.env.NODE_ENV !== 'production') {
  const reduxUnhandledAction = require('redux-unhandled-action').default;

  middlewares.push(reduxUnhandledAction());
}

// eslint-disable-next-line
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  reducer,
  // eslint-disable-next-line
  undefined,
  composeEnhancers(applyMiddleware(...middlewares))
);

if (module.hot) {
  // Enable Webpack hot module replacement for reducers
  // $FlowFixMe
  module.hot.accept('./reducer', () => {
    const nextRootReducer = require('./reducers/index').default;

    store.replaceReducer(nextRootReducer);
  });
}

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  // $FlowFixMe
  document.querySelector('#dorfmapWrapper')
);
