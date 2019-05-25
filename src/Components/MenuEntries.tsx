import './MenuEntries.scss';
import { AppState } from 'AppState';
import { connect, ResolveThunks } from 'react-redux';
import Actions, { executePreset, executeShortcut } from 'actions/device';
import Button from '@material-ui/core/Button';
import React, { useMemo } from 'react';

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

const MenuEntries = ({ entries, executePreset, executeShortcut, setLayer, type, closeFn }: Props) => {
  const entryButtons = useMemo(() => {
    const createHandleClick = (entry: any) => () => {
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

    return entries
      ? entries.map(entry => (
          <Button className="MenuEntries__button" key={entry} onClick={createHandleClick(entry)}>
            {entry}
          </Button>
        ))
      : null;
  }, [closeFn, entries, executePreset, executeShortcut, setLayer, type]);

  return <div className="MenuEntries">{entryButtons}</div>;
};

export default connect<{}, DispatchProps, OwnProps, AppState>(
  undefined,
  {
    setLayer: Actions.setLayer,
    executeShortcut,
    executePreset,
  }
)(MenuEntries);
