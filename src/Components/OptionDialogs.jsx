// @flow
import { Button } from 'react-toolbox/lib/button';
import { connect } from 'react-redux';
import { fetchMenues, setSelectedTab } from 'actions/menu';
import OptionDialog from './OptionDialog';
import React from 'react';
import styles from './OptionDialogs.scss';
import type { AppState } from 'AppState';
import type { Map } from 'immutable';

type State = {
  open?: boolean,
};

type ReduxProps = {
  services: Map<string, string>,
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
  handleRequestClose = () => {
    this.setState({ open: false });
  };
  render() {
    const { services } = this.props;

    return (
      <div>
        <div className={styles.dialogs}>
          <div>
            <Button flat onClick={() => this.handleClick(0)}>
              Actions
            </Button>
            <Button flat onClick={() => this.handleClick(1)}>
              Presets
            </Button>
            <Button flat onClick={() => this.handleClick(2)}>
              Layers
            </Button>
          </div>
          <div>
            {services
              .map((href, name) => (
                <a key={name} href={href} target="_blank">
                  <Button flat>{name}</Button>
                </a>
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
    services: state.menu.services,
  }),
  {
    fetchMenues,
    setSelectedTab,
  }
)(OptionDialogs);
