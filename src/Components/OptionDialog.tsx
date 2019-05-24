import { AppState } from 'AppState';
import { connect, ResolveThunks } from 'react-redux';
import { map } from 'lodash';
import Actions from 'actions/menu';
import Dialog from '@material-ui/core/Dialog';
import MenuEntries from './MenuEntries';
import React from 'react';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';

type StateProps = {
  menu: AppState['menu']['menu'];
  selectedTab: AppState['menu']['selectedTab'];
};
type DispatchProps = ResolveThunks<{
  setSelectedTab: typeof Actions.setSelectedTab,
}>;
type OwnProps = {
  handleRequestClose: () => any,
};
type Props = StateProps & DispatchProps & OwnProps;

class OptionDialog extends React.Component<Props> {
  static actions = ['actions', 'presets', 'layers'];
  setSelectedTab = (_: any, value: string) => {
    this.props.setSelectedTab(_, value);
  };
  render() {
    const { menu, handleRequestClose, selectedTab } = this.props;
    const selectedEntries = menu[selectedTab];

    return (
      <Dialog onClose={handleRequestClose} onBackdropClick={handleRequestClose} open>
        <Tabs value={selectedTab} onChange={this.setSelectedTab}>
          {map(menu, (_, type) => (
            <Tab key={type} value={type} label={type} />
          ))}
        </Tabs>
        <MenuEntries entries={selectedEntries} type={selectedTab} closeFn={handleRequestClose} />
      </Dialog>
    );
  }
}

export default connect<StateProps, DispatchProps, OwnProps, AppState>(
  state => ({
    menu: state.menu.menu,
    selectedTab: state.menu.selectedTab,
  }),
  {
    setSelectedTab: Actions.setSelectedTab,
  }
)(OptionDialog);
