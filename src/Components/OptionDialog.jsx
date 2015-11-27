import _ from 'lodash';
import MenuEntries from './MenuEntries.jsx';
import React from 'react';
import Dialog from 'material-ui/lib/dialog';
import { Tabs, Tab } from 'material-ui';

export default class OptionDialog extends React.Component {
  static propTypes = {
    activeType: React.PropTypes.string,
    menu: React.PropTypes.object,
  }
  state = {
    open: false,
  }
  closeDialog = () => {
    this.setState({
      open: false,
    });
  }
  show() {
    this.setState({
      open: true,
    });
  }
  handleRequestClose = () => {
    this.setState({
      open: false,
    });
  }
  handleTabChange = () => {
    setTimeout(() => {
      this.refs.optionDialog._positionDialog();
    }, 25);
  }
  render() {
    const { menu, activeType } = this.props;
    const { open } = this.state;
    const selectedIndex = _(menu).keys().indexOf(activeType);

    return (
      <Dialog
        ref="optionDialog"
        onRequestClose={this.handleRequestClose}
        bodyStyle={{ padding: 0 }}
        open={open}>
        <Tabs onChange={this.handleTabChange} key={selectedIndex} initialSelectedIndex={selectedIndex} ref="tabs">
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
