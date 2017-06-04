// @flow
import { inject } from 'mobx-react';
import { Tab, Tabs } from 'material-ui/Tabs';
import _ from 'lodash';
import Dialog from 'material-ui/Dialog';
import MenuEntries from './MenuEntries';
import React from 'react';
import type MenuStore from 'Store/MenuStore';

type Props = {
  activeType: ?string,
  handleRequestClose: Function,
  menuStore: MenuStore,
  open?: boolean,
};
@inject('menuStore')
export default class OptionDialog extends React.Component {
  // $FlowFixMe
  props: Props;
  static defaultProps = {
    open: false,
  };
  handleTabChange = () => this.forceUpdate();
  render() {
    const { menuStore, activeType, open } = this.props;
    const selectedIndex = Object.keys(menuStore.menu.toJS()).indexOf(
      activeType
    );

    return (
      <Dialog
        bodyStyle={style.wrapper}
        onRequestClose={this.props.handleRequestClose}
        open={open}>
        <Tabs
          onChange={this.handleTabChange}
          initialSelectedIndex={selectedIndex}>
          {menuStore.menu
            .map((entries, type) => (
              <Tab key={type} label={_.capitalize(type)}>
                <MenuEntries
                  entries={entries}
                  type={type}
                  closeFn={this.props.handleRequestClose}/>
              </Tab>
            ))
            .toList()}
        </Tabs>
      </Dialog>
    );
  }
}

const style = {
  wrapper: {
    padding: 0,
  },
};
