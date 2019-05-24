import './MenuEntries.scss';
import { AppState } from 'AppState';
import { connect, ResolveThunks } from 'react-redux';
import Actions, { executePreset, executeShortcut } from 'actions/device';
import Button from '@material-ui/core/Button';
import React from 'react';

type OwnProps = {
  closeFn: Function,
  entries?: any[],
  type: string,
};

type DispatchProps = ResolveThunks<{
  setLayer: typeof Actions.setLayer,
  executePreset: typeof executePreset,
  executeShortcut: typeof executeShortcut,
}>;

type Props = OwnProps & DispatchProps;

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

export default connect<{}, DispatchProps, OwnProps, AppState>(
  undefined,
  {
    setLayer: Actions.setLayer,
    executeShortcut,
    executePreset,
  }
)(MenuEntries);
