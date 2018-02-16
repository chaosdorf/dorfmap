// @flow
import { connect } from 'react-redux';
import { fetchMenues } from 'actions/menu';
import { internalServices } from 'selector/menu';
import Button from 'material-ui/Button';
import OptionDialog from './OptionDialog';
import React from 'react';
import styles from './OptionDialogs.scss';
import type { AppState } from 'AppState';
import type { Map } from 'immutable';

type State = {
  open?: boolean,
  title?: string,
};

type ReduxProps = {
  services: Map<string, Function>,
};

type Props = ReduxProps & {
  fetchMenues: typeof fetchMenues,
};

class OptionDialogs extends React.Component<Props, State> {
  actions: Object = {
    actions: 0,
    presets: 1,
    layers: 2,
  };
  state: State = {};
  componentWillMount() {
    this.props.fetchMenues();
  }
  handleClick(action: number) {
    let title;

    switch (action) {
      case this.actions.actions:
        title = 'actions';
        break;
      case this.actions.presets:
        title = 'presets';
        break;
      case this.actions.layers:
        title = 'layers';
        break;
      default:
        break;
    }
    this.setState({
      title,
      open: true,
    });
  }
  handleActionsClick = () => {
    this.handleClick(this.actions.actions);
  };
  handlePresetsClick = () => {
    this.handleClick(this.actions.presets);
  };
  handleLayersClick = () => {
    this.handleClick(this.actions.layers);
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
            <Button variant="flat" onClick={this.handleActionsClick}>
              {'Actions'}
            </Button>
            <Button variant="flat" onClick={this.handlePresetsClick}>
              {'Presets'}
            </Button>
            <Button variant="flat" onClick={this.handleLayersClick}>
              {'Layers'}
            </Button>
          </div>
          <div>
            {services
              .map((onClick, name) => (
                <Button key={name} variant="flat" onClick={onClick}>
                  {name}
                </Button>
              ))
              .toList()}
          </div>
        </div>

        <OptionDialog
          activeType={this.state.title}
          handleRequestClose={this.handleRequestClose}
          open={this.state.open}
        />
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
  }
)(OptionDialogs);
