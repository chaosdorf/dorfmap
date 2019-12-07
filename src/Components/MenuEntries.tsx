import Button from '@material-ui/core/Button';
import DeviceContainer, { useExecuteAction } from 'container/DeviceContainer';
import React, { useMemo } from 'react';
import useStyles from './MenuEntries.style';

interface Props {
  closeFn: Function;
  entries?: any[];
  type: string;
}

const MenuEntries = ({ entries, type, closeFn }: Props) => {
  const { setLayer } = DeviceContainer.useContainer();
  const executeAction = useExecuteAction();
  const classes = useStyles();
  const entryButtons = useMemo(() => {
    const createHandleClick = (entry: any) => () => {
      switch (type) {
        case 'layers':
          setLayer(entry);
          break;
        case 'presets':
          executeAction('preset', entry);
          break;
        case 'actions':
          executeAction('shortcut', entry);
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
  }, [classes.button, closeFn, entries, executeAction, setLayer, type]);

  return <div className={classes.main}>{entryButtons}</div>;
};

export default MenuEntries;
