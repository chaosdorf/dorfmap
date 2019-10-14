import { map } from 'lodash';
import { useDispatch } from 'react-redux';
import Actions from 'actions/menu';
import Dialog from '@material-ui/core/Dialog';
import MenuEntries from './MenuEntries';
import React, { useCallback } from 'react';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import useReduxState from 'hooks/useReduxState';

type Props = {
  handleRequestClose: () => any;
};

const OptionDialog = ({ handleRequestClose }: Props) => {
  const dispatch = useDispatch();
  const menu = useReduxState(state => state.menu.menu);
  const selectedTab = useReduxState(state => state.menu.selectedTab);
  const selectedEntries = menu[selectedTab];

  const setSelectedTab = useCallback(
    (_: any, value: string) => {
      dispatch(Actions.setSelectedTab(value));
    },
    [dispatch]
  );

  return (
    <Dialog
      onClose={handleRequestClose}
      onBackdropClick={handleRequestClose}
      open
    >
      <Tabs value={selectedTab} onChange={setSelectedTab}>
        {map(menu, (_, type) => (
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
