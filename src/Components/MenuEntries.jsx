/* @flow */
import _ from 'lodash';
import { changeLayer, executePreset, executeShortcut } from '../Actions/devices';
import { FlatButton } from 'material-ui';
import ConfiguredRadium from 'configuredRadium';
import React from 'react';


/*::`*/
@ConfiguredRadium
/*::`*/
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
  render(): React.Element {
    const entries = _.map(this.props.entries, entry => (
      <FlatButton key={entry} label={entry} onClick={this.handleClick.bind(this, entry)}/>
    ));
    return (
      <div style={MenuEntries.style.wrapper}>
        {entries}
      </div>
    );
  }
}
