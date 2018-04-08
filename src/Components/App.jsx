// @flow
import { setupPrimus } from '../primus';
import Dorfmap from './Dorfmap';
import PropTypes from 'prop-types';
import React from 'react';

export default class App extends React.PureComponent<{}> {
  static contextTypes = {
    store: PropTypes.object.isRequired,
  };
  componentDidMount() {
    setupPrimus(this.context.store);
  }
  render() {
    return <Dorfmap />;
  }
}
