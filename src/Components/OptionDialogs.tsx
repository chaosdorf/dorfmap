import { map } from 'lodash';
import { useDispatch } from 'react-redux';
import Actions, { fetchMenues } from 'actions/menu';
import Button from '@material-ui/core/Button';
import OptionDialog from './OptionDialog';
import React, { useCallback, useEffect, useState } from 'react';
import useReduxState from 'hooks/useReduxState';
import useStyles from './OptionDialogs.style';

const OptionDialogs = () => {
  const dispatch = useDispatch();
  const services = useReduxState(state => state.menu.services);

  useEffect(() => {
    dispatch(fetchMenues());
  }, [dispatch]);
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const handleClick = useCallback(
    (action: string) => {
      dispatch(Actions.setSelectedTab(action));
      setOpen(true);
    },
    [dispatch]
  );
  const handleRequestClose = useCallback(() => setOpen(false), []);

  return (
    <>
      <div className={classes.OptionDialogs}>
        <div>
          <Button onClick={() => handleClick('actions')}>Actions</Button>
          <Button onClick={() => handleClick('presets')}>Presets</Button>
          <Button onClick={() => handleClick('layers')}>Layers</Button>
        </div>
        <div>
          {map(services, (href, name) => (
            <a key={name} href={href} target="_blank" rel="noopener noreferrer">
              <Button>{name}</Button>
            </a>
          ))}
        </div>
      </div>

      {open && <OptionDialog handleRequestClose={handleRequestClose} />}
    </>
  );
};

export default OptionDialogs;
