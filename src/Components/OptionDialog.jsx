// @flow
import { connect } from 'react-redux';
import { Overlay, Panel } from 'rebass';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import _ from 'lodash';
import MenuEntries from './MenuEntries';
import React from 'react';

@connect(state => ({ menues: state.menues }))
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
  render() {
    const { menues, activeType, open } = this.props;
    const selectedIndex = Object.keys(menues).indexOf(activeType);

    return (
      <Overlay onDismiss={this.props.handleRequestClose} open={open}>
        <Panel>
          <Tabs selectedIndex={selectedIndex}>
            <TabList>
              {_.map(this.props.menues, (entries, type) => (
                <Tab key={type}>
                  {_.capitalize(type)}
                </Tab>
              ))}
            </TabList>
            {_.map(this.props.menues, (entries, type) => (
              <TabPanel key={type}>
                <MenuEntries
                  entries={entries}
                  type={type}
                  closeFn={this.props.handleRequestClose}/>
              </TabPanel>
            ))}
          </Tabs>
        </Panel>
      </Overlay>
    );
  }
}
