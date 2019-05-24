import './axiosDefaults';
import './main.scss';
import * as React from 'react';
import { applyMiddleware, compose, createStore } from 'redux';
import { Provider } from 'react-redux';
import { setupSocket } from './socket';
import Dorfmap from './Components/Dorfmap';
import ReactDOM from 'react-dom';
import reducer from './reducers';
import thunkMiddleware from 'redux-thunk';

const middlewares = [thunkMiddleware];

if (process.env.NODE_ENV !== 'production') {
  const reduxUnhandledAction = require('redux-unhandled-action').default;

  middlewares.push(reduxUnhandledAction());
}

// @ts-ignore
// eslint-disable-next-line
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  reducer,
  // eslint-disable-next-line
  undefined,
  composeEnhancers(applyMiddleware(...middlewares))
);

// @ts-ignore
if (module.hot) {
  // Enable Webpack hot module replacement for reducers
  // @ts-ignore
  module.hot.accept('./reducers', () => {
    const nextRootReducer = require('./reducers/index').default;

    store.replaceReducer(nextRootReducer);
  });
}

ReactDOM.render(
  <Provider store={store}>
    <Dorfmap />
  </Provider>,
  document.querySelector('#dorfmapWrapper')
);
setupSocket(store);
