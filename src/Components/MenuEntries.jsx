// @flow
import './MenuEntries.scss';
import { connect } from 'react-redux';
import { executePreset, executeShortcut, setLayer } from 'actions/device';
import Button from '@material-ui/core/Button';
import React from 'react';

type Props = {
  closeFn: Function,
  entries: ?(any[]),
  type: string,
  setLayer: typeof setLayer,
  executePreset: typeof executePreset,
  executeShortcut: typeof executeShortcut,
};

class MenuEntries extends React.Component<Props> {
  handleClick(entry: any) {
    return () => {
      const { executePreset, executeShortcut, setLayer, type, closeFn } = this.props;

      switch (type) {
        case 'layers':
          setLayer(entry);
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
      closeFn();
    };
  }
  render() {
    const entries = this.props.entries
      ? this.props.entries.map(entry => (
          <Button className="MenuEntries__button" key={entry} onClick={this.handleClick(entry)}>
            {entry}
          </Button>
        ))
      : null;

    return <div className="MenuEntries">{entries}</div>;
  }
}

export default connect(null, {
  setLayer,
  executeShortcut,
  executePreset,
})(MenuEntries);
