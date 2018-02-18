// @flow
import { Button } from 'react-toolbox/lib/button';
import { connect } from 'react-redux';
import { fetchMenues, setSelectedTab } from 'actions/menu';
import { internalServices } from 'selector/menu';
import OptionDialog from './OptionDialog';
import React from 'react';
import styles from './OptionDialogs.scss';
import type { AppState } from 'AppState';
import type { Map } from 'immutable';

type State = {
  open?: boolean,
};

type ReduxProps = {
  services: Map<string, Function>,
};

type Props = ReduxProps & {
  fetchMenues: typeof fetchMenues,
  setSelectedTab: typeof setSelectedTab,
};

class OptionDialogs extends React.Component<Props, State> {
  state: State = {};
  componentWillMount() {
    this.props.fetchMenues();
  }
  handleClick(action: number) {
    this.props.setSelectedTab(action);
    this.setState({
      open: true,
    });
  }
  handleActionsClick = () => {
    this.handleClick(0);
  };
  handlePresetsClick = () => {
    this.handleClick(1);
  };
  handleLayersClick = () => {
    this.handleClick(2);
  };
  handleRequestClose = () => {
    this.setState({ open: false });
  };
  render() {
    const { services } = this.props;

    return (
      <div>
        <div className={styles.dialogs}>
          <div>
            <Button flat onClick={this.handleActionsClick}>
              Actions
            </Button>
            <Button flat onClick={this.handlePresetsClick}>
              Presets
            </Button>
            <Button flat onClick={this.handleLayersClick}>
              Layers
            </Button>
          </div>
          <div>
            {services
              .map((onClick, name) => (
                <Button key={name} flat onClick={onClick}>
                  {name}
                </Button>
              ))
              .toList()}
          </div>
        </div>

        <OptionDialog handleRequestClose={this.handleRequestClose} open={this.state.open} />
      </div>
    );
  }
}

export default connect(
  (state: AppState) => ({
    services: internalServices(state),
  }),
  {
    fetchMenues,
    setSelectedTab,
  }
)(OptionDialogs);
