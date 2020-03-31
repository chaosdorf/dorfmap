import Dialog from '@material-ui/core/Dialog';
import MenuContainer from 'container/MenuContainer';
import MenuEntries from './MenuEntries';
import React, { useCallback } from 'react';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';

interface Props {
  handleRequestClose: () => any;
}

const OptionDialog = ({ handleRequestClose }: Props) => {
  const { menues, selectedTab, setSelectedTab } = MenuContainer.useContainer();
  const selectedEntries = menues[selectedTab];

  const handleOnChange = useCallback(
    (_: any, value: string) => {
      setSelectedTab(value);
    },
    [setSelectedTab]
  );

  return (
    <Dialog
      onClose={handleRequestClose}
      onBackdropClick={handleRequestClose}
      open
    >
      <Tabs value={selectedTab} onChange={handleOnChange}>
        {Object.keys(menues).map((type) => (
          <Tab key={type} value={type} label={type} />
        ))}
      </Tabs>
      <MenuEntries
        entries={selectedEntries}
        type={selectedTab}
        closeFn={handleRequestClose}
      />
    </Dialog>
  );
};

export default OptionDialog;
