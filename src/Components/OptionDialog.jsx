// @flow
import { connect } from 'react-redux';
import { Tab, Tabs } from 'material-ui/Tabs';
import _ from 'lodash';
import Dialog from 'material-ui/Dialog';
import MenuEntries from './MenuEntries';
import React from 'react';
import type { AppState } from 'AppState';

type ReduxProps = {
  menu: $PropertyType<$PropertyType<AppState, 'menu'>, 'menu'>,
};
type Props = ReduxProps & {
  activeType: ?string,
  handleRequestClose: Function,
  open?: boolean,
};
class OptionDialog extends React.Component<Props> {
  static defaultProps = {
    open: false,
  };
  handleTabChange = () => this.forceUpdate();
  render() {
    const { menu, activeType, open } = this.props;
    // $FlowFixMe
    const selectedIndex = Object.keys(menu.toJS()).indexOf(activeType);

    return (
      <Dialog bodyStyle={style.wrapper} onRequestClose={this.props.handleRequestClose} open={open}>
        <Tabs onChange={this.handleTabChange} initialSelectedIndex={selectedIndex}>
          {menu
            .map((entries, type) => (
              <Tab key={type} label={_.capitalize(type)}>
                <MenuEntries entries={entries} type={type} closeFn={this.props.handleRequestClose} />
              </Tab>
            ))
            .toList()}
        </Tabs>
      </Dialog>
    );
  }
}

export default connect((state: AppState): ReduxProps => ({
  menu: state.menu.menu,
}))(OptionDialog);

const style = {
  wrapper: {
    padding: 0,
  },
};
