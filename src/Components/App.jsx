/* @flow */
import _ from 'lodash';
import { createStore, bindActionCreators, compose, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import React from 'react';
import reduxPromise from 'redux-promise';

let store;

const reduxActions = require('redux-actions');
reduxActions.handleActions = (function(old) {
  return function(reducerMap: Object, ...rest) {
    _.each(reducerMap, (r, index) => {
      reducerMap[index] = function(state, action) {
        const newState = r(state, action);
        return {
          ...state,
          ...newState,
        };
      };
    });
    return old.call(this, reducerMap, ...rest);
  };
}(reduxActions.handleActions));
const reducer = require('../Reducers').default;

if (IS_PRODUCTION) {
  store = compose(
    applyMiddleware(reduxPromise)
  )(createStore)(reducer);
} else {
  const createDevStore = compose(
    applyMiddleware(reduxPromise),
  )(createStore);

  store = createDevStore(reducer);

  if (module.hot) {
    module.hot.accept('../Reducers', () => {
      const nextRootReducer = require('../Reducers/index');
      store.replaceReducer(nextRootReducer);
    });
  }
}

global.store = store;

reduxActions.createAction = (function(old) {
  return function(...args) {
    const action = old.apply(this, args);
    return bindActionCreators(action, store.dispatch);
  };
}(reduxActions.createAction));

const Dorfmap = require('./Dorfmap').default;
export default class App extends React.Component {
  static childContextTypes = {
    store: React.PropTypes.any,
  };
  getChildContext(): Object {
    return {
      store,
    };
  }
  render(): React.Element {
    return (
      <div>
        <Provider store={store}>
          <Dorfmap/>
        </Provider>
      </div>
    );
  }
}
