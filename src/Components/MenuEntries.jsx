// @flow
import { connect } from 'react-redux';
import { executePreset, executeShortcut, setLayer } from 'actions/device';
import _ from 'lodash';
import FlatButton from 'material-ui/FlatButton';
import React from 'react';

type Props = {
  closeFn: Function,
  entries: ?(any[]),
  type: string,
  setLayerProp: typeof setLayer,
  executePresetProp: typeof executePreset,
  executeShortcutProp: typeof executeShortcut,
};

class MenuEntries extends React.Component<Props> {
  handleClick(entry: any) {
    return () => {
      const { executePresetProp, executeShortcutProp, setLayerProp, type, closeFn } = this.props;

      switch (type) {
        case 'layers':
          setLayerProp(entry);
          break;
        case 'presets':
          executePresetProp(entry);
          break;
        case 'actions':
          executeShortcutProp(entry);
          break;
        default:
          break;
      }
      closeFn();
    };
  }
  render() {
    const entries = _.map(this.props.entries, entry => (
      <FlatButton style={style.button} key={entry} onClick={this.handleClick(entry)}>
        {entry}
      </FlatButton>
    ));

    return <div style={style.wrapper}>{entries}</div>;
  }
}

export default connect(null, {
  setLayerProp: setLayer,
  executeShortcutProp: executeShortcut,
  executePresetProp: executePreset,
})(MenuEntries);

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
