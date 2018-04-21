// @flow
import { connect } from 'react-redux';
import { setSelectedTab } from 'actions/menu';
import Dialog from 'material-ui/Dialog';
import MenuEntries from './MenuEntries';
import React from 'react';
import Tabs, { Tab } from 'material-ui/Tabs';
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
    const selectedEntries = menu.get(selectedTab);

    return (
      <Dialog onClose={handleRequestClose} onBackdropClick={handleRequestClose} open={open}>
        <Tabs value={selectedTab} onChange={setSelectedTab}>
          {menu
            .map((entries, type) => <Tab key={type} value={type} label={type} />)
            .toList()
            .toArray()}
        </Tabs>
        <MenuEntries entries={selectedEntries} type={selectedTab} closeFn={handleRequestClose} />
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
