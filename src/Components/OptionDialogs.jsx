// @flow
import './OptionDialogs.scss';
import { connect } from 'react-redux';
import { fetchMenues, setSelectedTab } from 'actions/menu';
import { Map } from 'immutable';
import Button from '@material-ui/core/Button';
import OptionDialog from './OptionDialog';
import React from 'react';
import type { AppState } from 'AppState';

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
  componentDidMount() {
    this.props.fetchMenues();
  }
  handleClick(action: string) {
    this.props.setSelectedTab(null, action);
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
        <div className="OptionDialogs">
          <div>
            <Button onClick={() => this.handleClick('actions')}>Actions</Button>
            <Button onClick={() => this.handleClick('presets')}>Presets</Button>
            <Button onClick={() => this.handleClick('layers')}>Layers</Button>
          </div>
          <div>
            {services
              .map((href, name) => (
                <a key={name} href={href} target="_blank">
                  <Button>{name}</Button>
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
