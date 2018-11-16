// @flow
import { Actions } from 'actions/menu';
import { connect } from 'react-redux';
import { map } from 'lodash';
import Dialog from '@material-ui/core/Dialog';
import MenuEntries from './MenuEntries';
import React from 'react';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import type { AppState } from 'AppState';

type StateProps = {|
  menu: $PropertyType<$PropertyType<AppState, 'menu'>, 'menu'>,
  selectedTab: $PropertyType<$PropertyType<AppState, 'menu'>, 'selectedTab'>,
|};
type DispatchProps = {|
  setSelectedTab: typeof Actions.setSelectedTab,
|};
type OwnProps = {|
  handleRequestClose: Function,
  open?: boolean,
|};
type Props = {|
  ...StateProps,
  ...DispatchProps,
  ...OwnProps,
|};

class OptionDialog extends React.Component<Props> {
  static actions = ['actions', 'presets', 'layers'];
  static defaultProps = {
    open: false,
  };
  setSelectedTab = (e, value) => {
    this.props.setSelectedTab(e, value);
  };
  render() {
    const { menu, open, handleRequestClose, selectedTab } = this.props;
    const selectedEntries = menu[selectedTab];

    return (
      <Dialog onClose={handleRequestClose} onBackdropClick={handleRequestClose} open={open}>
        <Tabs value={selectedTab} onChange={this.setSelectedTab}>
          {map(menu, (entries, type) => (
            <Tab key={type} value={type} label={type} />
          ))}
        </Tabs>
        <MenuEntries entries={selectedEntries} type={selectedTab} closeFn={handleRequestClose} />
      </Dialog>
    );
  }
}

export default connect(
  (state: AppState): StateProps => ({
    menu: state.menu.menu,
    selectedTab: state.menu.selectedTab,
  }),
  {
    setSelectedTab: Actions.setSelectedTab,
  }
)(OptionDialog);
