/* @flow */
import _ from 'lodash';
import MenuEntries from './MenuEntries';
import React from 'react';
import { Tabs, Tab, Dialog } from 'material-ui';
import { connect } from 'react-redux';

/*::`*/
@connect(state => ({ menues: state.menues }))
/*::`*/
export default class OptionDialog extends React.Component {
  static propTypes = {
    activeType: React.PropTypes.string,
    handleRequestClose: React.PropTypes.func,
    menues: React.PropTypes.object,
    open: React.PropTypes.bool,
  };
  static defaultProps = {
    open: false,
  };
  handleTabChange = () => {
    setTimeout(() => {
      this.refs.optionDialog._positionDialog();
    }, 25);
  };
  render() {
    const { menues, activeType, open } = this.props;
    const selectedIndex = _(menues).keys().indexOf(activeType);

    return (
      <Dialog
        ref="optionDialog"
        onRequestClose={this.props.handleRequestClose}
        bodyStyle={{ padding: 0 }}
        open={open}>
        <Tabs onChange={this.handleTabChange} key={selectedIndex} initialSelectedIndex={selectedIndex} ref="tabs">
          {_.map(this.props.menues, (entries, type) => {
            return (
              <Tab label={_.capitalize(type)} key={type}>
                <MenuEntries entries={entries} type={type} closeFn={this.props.handleRequestClose}/>
              </Tab>
            );
          })}
        </Tabs>
      </Dialog>
    );
  }
}
