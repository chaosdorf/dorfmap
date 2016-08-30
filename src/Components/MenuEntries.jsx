/* @flow */
import _ from 'lodash';
import { changeLayer, executePreset, executeShortcut } from '../Actions/devices';
import { ButtonOutline } from 'rebass';
import ConfiguredRadium from 'configuredRadium';
import React from 'react';


@ConfiguredRadium
export default class MenuEntries extends React.Component {
  static propTypes = {
    closeFn: React.PropTypes.func,
    entries: React.PropTypes.array,
    type: React.PropTypes.string.isRequired,
  };
  static style = {
    wrapper: {
      display: 'flex',
      flexDirection: 'column',
    },
    button: {
      marginTop: 2,
      marginBottom: 2,
    },
  };
  handleClick(entry: any) {
    switch (this.props.type) {
      case 'layers':
      changeLayer(entry);
      break;
      case 'presets':
      executePreset(entry);
      break;
      case 'actions':
      executeShortcut(entry);
      break;
      default:
      break;
    }
    this.props.closeFn();
  }
  render() {
    const entries = _.map(this.props.entries, entry => (
      <ButtonOutline style={MenuEntries.style.button} key={entry} onClick={this.handleClick.bind(this, entry)}>{entry}</ButtonOutline>
    ));
    return (
      <div style={MenuEntries.style.wrapper}>
        {entries}
      </div>
    );
  }
}
