// @flow
import { setupSocket } from '../socket';
import Dorfmap from './Dorfmap';
import PropTypes from 'prop-types';
import React from 'react';

export default class App extends React.PureComponent<{}> {
  static contextTypes = {
    store: PropTypes.object.isRequired,
  };
  componentDidMount() {
    setupSocket(this.context.store);
  }
  render() {
    return <Dorfmap />;
  }
}
