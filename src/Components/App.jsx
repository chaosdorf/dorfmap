// @flow
import { setupPrimus } from '../primus';
import Dorfmap from './Dorfmap';
import PropTypes from 'prop-types';
import React from 'react';
import Reboot from 'material-ui/Reboot';

export default class App extends React.PureComponent<{}> {
  static contextTypes = {
    store: PropTypes.object.isRequired,
  };
  componentWillMount() {
    setupPrimus(this.context.store);
  }
  render() {
    return [<Reboot key="r" />, <Dorfmap key="d" />];
  }
}
