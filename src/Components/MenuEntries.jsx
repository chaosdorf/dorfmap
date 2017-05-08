// @flow
import {
  changeLayer,
  executePreset,
  executeShortcut,
} from '../Actions/devices';
import _ from 'lodash';
import ConfiguredRadium from 'configuredRadium';
import FlatButton from 'material-ui/FlatButton';
import React from 'react';

type Props = {
  closeFn: Function,
  entries: ?(any[]),
  type: string
};

@ConfiguredRadium
export default class MenuEntries extends React.Component {
  props: Props;
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
      <FlatButton
        style={style.button}
        key={entry}
        onClick={this.handleClick.bind(this, entry)}>
        {entry}
      </FlatButton>
    ));
    return (
      <div style={style.wrapper}>
        {entries}
      </div>
    );
  }
}

const style = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
  },
  button: {
    marginTop: 2,
    marginBottom: 2,
  },
};
