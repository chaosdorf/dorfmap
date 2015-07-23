import { Dialog, Tabs, Tab } from 'material-ui';

import MenuEntries from '../MenuEntries/menuEntries.jsx';
import React from 'react';

class OptionDialog extends React.Component {
  closeDialog = () => {
    this.refs.optionDialog.dismiss();
  }
  show() {
    this.refs.optionDialog.show();
  }
  render() {
    const menu = this.props.menu;
    const active = this.props.activeType;
    const selectedIndex = _(menu).keys().indexOf(active);

    return (
      <Dialog
        ref="optionDialog"
        modal={false}
        bodyStyle={{padding: 0}}>
        <Tabs key={selectedIndex} initialSelectedIndex={selectedIndex} ref="tabs">
          {_.map(this.props.menu, (entries, type) => {
            return (
              <Tab label={_.capitalize(type)} key={type}>
                <MenuEntries entries={entries} type={type} closeFn={this.closeDialog}/>
              </Tab>
            );
          })}
        </Tabs>
      </Dialog>
    );
  }
}

OptionDialog.propTypes = {
  menu: React.PropTypes.object,
  activeType: React.PropTypes.string
};

export default OptionDialog;
