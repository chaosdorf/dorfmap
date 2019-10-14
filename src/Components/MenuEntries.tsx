import { useDispatch } from 'react-redux';
import Actions, { executePreset, executeShortcut } from 'actions/device';
import Button from '@material-ui/core/Button';
import React, { useMemo } from 'react';
import useStyles from './MenuEntries.style';

type Props = {
  closeFn: Function;
  entries?: any[];
  type: string;
};

const MenuEntries = ({ entries, type, closeFn }: Props) => {
  const dispatch = useDispatch();
  const classes = useStyles();
  const entryButtons = useMemo(() => {
    const createHandleClick = (entry: any) => () => {
      switch (type) {
        case 'layers':
          dispatch(Actions.setLayer(entry));
          break;
        case 'presets':
          dispatch(executePreset(entry));
          break;
        case 'actions':
          dispatch(executeShortcut(entry));
          break;
        default:
          break;
      }
      closeFn();
    };

    return entries
      ? entries.map(entry => (
          <Button
            className={classes.button}
            key={entry}
            onClick={createHandleClick(entry)}
          >
            {entry}
          </Button>
        ))
      : null;
  }, [classes.button, closeFn, dispatch, entries, type]);

  return <div className={classes.main}>{entryButtons}</div>;
};

export default MenuEntries;
