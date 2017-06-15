// @flow
import { inject } from 'mobx-react';
import _ from 'lodash';
import FlatButton from 'material-ui/FlatButton';
import React from 'react';
import type DeviceStore from 'Store/DeviceStore';

type Props = {
  closeFn: Function,
  entries: ?(any[]),
  type: string,
  deviceStore?: DeviceStore,
};

@inject('deviceStore')
export default class MenuEntries extends React.Component {
  props: Props;
  handleClick(entry: any) {
    return () => {
      const { deviceStore, type, closeFn } = this.props;
      if (!deviceStore) {
        return;
      }
      switch (type) {
        case 'layers':
          deviceStore.changeLayer(entry);
          break;
        case 'presets':
          deviceStore.executePreset(entry);
          break;
        case 'actions':
          deviceStore.executeShortcut(entry);
          break;
        default:
          break;
      }
      closeFn();
    };
  }
  render() {
    const entries = _.map(this.props.entries, entry =>
      <FlatButton
        style={style.button}
        key={entry}
        onClick={this.handleClick(entry)}>
        {entry}
      </FlatButton>
    );
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
