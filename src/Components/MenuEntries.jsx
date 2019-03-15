// @flow
import './MenuEntries.scss';
import { Actions, executePreset, executeShortcut } from 'actions/device';
import { connect } from 'react-redux';
import Button from '@material-ui/core/Button';
import React from 'react';
import type { AppState } from 'AppState';

type OwnProps = {|
  closeFn: Function,
  entries: ?(any[]),
  type: string,
|};

type DispatchProps = {|
  setLayer: typeof Actions.setLayer,
  executePreset: typeof executePreset,
  executeShortcut: typeof executeShortcut,
|};

type Props = {|
  ...OwnProps,
  ...DispatchProps,
|};

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

export default connect<Props, OwnProps, _, DispatchProps, AppState, _>(
  undefined,
  {
    setLayer: Actions.setLayer,
    executeShortcut,
    executePreset,
  }
)(MenuEntries);
