// @flow
import { connect } from 'react-redux';
import { setSelectedTab } from 'actions/menu';
import { Tab, Tabs } from 'react-toolbox/lib/tabs';
import Dialog from 'react-toolbox/lib/dialog';
import MenuEntries from './MenuEntries';
import React from 'react';
import type { AppState } from 'AppState';

type ReduxProps = {
  menu: $PropertyType<$PropertyType<AppState, 'menu'>, 'menu'>,
  selectedTab: $PropertyType<$PropertyType<AppState, 'menu'>, 'selectedTab'>,
};
type Props = ReduxProps & {
  activeType: ?string,
  handleRequestClose: Function,
  open?: boolean,
  setSelectedTab: typeof setSelectedTab,
};

class OptionDialog extends React.Component<Props> {
  static actions = ['actions', 'presets', 'layers'];
  static defaultProps = {
    open: false,
  };
  render() {
    const { menu, open, handleRequestClose, selectedTab, setSelectedTab } = this.props;
    const selectedEntries = menu.get(OptionDialog.actions[selectedTab]);

    return (
      <Dialog onOverlayClick={handleRequestClose} onEscKeyDown={handleRequestClose} active={open}>
        <Tabs fixed index={selectedTab} onChange={setSelectedTab}>
          {menu
            .map((entries, type) => <Tab key={type} value={type} label={type} />)
            .toList()
            .toArray()}
        </Tabs>
        <MenuEntries entries={selectedEntries} type={OptionDialog.actions[selectedTab]} closeFn={handleRequestClose} />
      </Dialog>
    );
  }
}

export default connect(
  (state: AppState): ReduxProps => ({
    menu: state.menu.menu,
    selectedTab: state.menu.selectedTab,
  }),
  {
    setSelectedTab,
  }
)(OptionDialog);
