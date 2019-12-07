import Button from '@material-ui/core/Button';
import MenuContainer from 'container/MenuContainer';
import OptionDialog from './OptionDialog';
import React, { useCallback, useState } from 'react';
import useStyles from './OptionDialogs.style';

const services = {
  mete: 'https://mete.chaosdorf.space',
  prittstift: 'https://prittstift.chaosdorf.space',
  mpd: 'https://ympd.chaosdorf.space',
  pulseWeb: 'https://pulseweb.chaosdorf.space',
};

const OptionDialogs = () => {
  const { setSelectedTab } = MenuContainer.useContainer();
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const handleClick = useCallback(
    (action: string) => {
      setSelectedTab(action);
      setOpen(true);
    },
    [setSelectedTab]
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
          {Object.entries(services).map(([name, href]) => (
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

const OptionDialogsWrap = () => (
  <MenuContainer.Provider>
    <OptionDialogs />
  </MenuContainer.Provider>
);

export default OptionDialogsWrap;
