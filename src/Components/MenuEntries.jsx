import _ from 'lodash';
import { FlatButton } from 'material-ui';
import lampStore from '../Stores/lampStore.js';
import Radium from 'radium';
import React from 'react';


@Radium
export default class MenuEntries extends React.Component {
  static propTypes = {
    closeFn: React.PropTypes.func,
    entries: React.PropTypes.array,
    type: React.PropTypes.string.isRequired,
  }
  static style = {
    wrapper: {
      display: 'flex',
      flexDirection: 'column',
    },
  }
  handleClick(entry) {
    switch (this.props.type) {
      case 'layers':
      lampStore.updateLayer(entry);
      break;
      case 'presets':
      lampStore.executePreset(entry);
      break;
      case 'actions':
      lampStore.executeShortcut(entry);
      break;
    }
    this.props.closeFn();
  }
  render() {
    const entries = _.map(this.props.entries, entry => {
      return (
        <FlatButton key={entry} label={entry} onClick={this.handleClick.bind(this, entry)}/>
      );
    });
    return (
      <div style={MenuEntries.style.wrapper}>{entries}</div>
    );
  }
}
