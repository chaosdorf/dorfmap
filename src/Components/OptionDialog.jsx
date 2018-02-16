// @flow
import { connect } from 'react-redux';
import Dialog from 'material-ui/Dialog';
import MenuEntries from './MenuEntries';
import React from 'react';
import Tabs, { Tab } from 'material-ui/Tabs';
import type { AppState } from 'AppState';

type ReduxProps = {
  menu: $PropertyType<$PropertyType<AppState, 'menu'>, 'menu'>,
};
type Props = ReduxProps & {
  activeType: ?string,
  handleRequestClose: Function,
  open?: boolean,
};
type State = {
  selected: ?string,
};
class OptionDialog extends React.Component<Props, State> {
  static defaultProps = {
    open: false,
  };
  state = {
    selected: this.props.activeType,
  };
  componentWillReceiveProps(props) {
    this.setState({
      selected: props.activeType,
    });
  }
  handleTabChange = (e, selected) => {
    this.setState({
      selected,
    });
  };
  render() {
    const { menu, open } = this.props;
    const { selected } = this.state;
    const selectedEntries = menu.get(selected);

    return (
      <Dialog fullscreen onClose={this.props.handleRequestClose} open={open}>
        <Tabs onChange={this.handleTabChange} value={selected}>
          {menu
            .map((entries, type) => <Tab key={type} value={type} label={type} />)
            .toList()
            .toArray()}
        </Tabs>
        <MenuEntries entries={selectedEntries} type={selected} closeFn={this.props.handleRequestClose} />
      </Dialog>
    );
  }
}

export default connect((state: AppState): ReduxProps => ({
  menu: state.menu.menu,
}))(OptionDialog);
