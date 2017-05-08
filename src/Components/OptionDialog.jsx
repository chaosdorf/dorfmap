// @flow
import { connect } from 'react-redux';
import { Tab, Tabs } from 'material-ui/Tabs';
import _ from 'lodash';
import Dialog from 'material-ui/Dialog';
import MenuEntries from './MenuEntries';
import React from 'react';

type Props = {
  activeType: ?string,
  handleRequestClose: Function,
  menues: Object,
  open?: boolean
};
@connect(state => ({ menues: state.menues }))
export default class OptionDialog extends React.Component {
  // $FlowFixMe
  props: Props;
  static defaultProps = {
    open: false,
  };
  handleTabChange = () => this.forceUpdate();
  render() {
    const { menues, activeType, open } = this.props;
    const selectedIndex = Object.keys(menues).indexOf(activeType);

    return (
      <Dialog
        bodyStyle={style.wrapper}
        onRequestClose={this.props.handleRequestClose}
        open={open}>
        <Tabs
          onChange={this.handleTabChange}
          initialSelectedIndex={selectedIndex}>
          {_.map(this.props.menues, (entries, type) => (
            <Tab key={type} label={_.capitalize(type)}>
              <MenuEntries
                entries={entries}
                type={type}
                closeFn={this.props.handleRequestClose}/>
            </Tab>
          ))}
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
