// @flow
import { connect } from 'react-redux';
import { executePreset, executeShortcut, setLayer } from 'actions/device';
import Button from 'material-ui/Button';
import React from 'react';
import styles from './MenuEntries.scss';

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
    const entries = this.props.entries
      ? this.props.entries.map(entry => (
          <Button variant="flat" className={styles.button} key={entry} onClick={this.handleClick(entry)}>
            {entry}
          </Button>
        ))
      : null;

    return <div className={styles.wrapper}>{entries}</div>;
  }
}

export default connect(null, {
  setLayerProp: setLayer,
  executeShortcutProp: executeShortcut,
  executePresetProp: executePreset,
})(MenuEntries);
