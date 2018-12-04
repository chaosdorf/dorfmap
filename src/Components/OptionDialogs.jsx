// @flow
import './OptionDialogs.scss';
import { Actions, fetchMenues } from 'actions/menu';
import { connect } from 'react-redux';
import { map } from 'lodash';
import Button from '@material-ui/core/Button';
import OptionDialog from './OptionDialog';
import React from 'react';
import type { AppState } from 'AppState';

type State = {
  open?: boolean,
};

type StateProps = {|
  services: $PropertyType<$PropertyType<AppState, 'menu'>, 'services'>,
|};

type DispatchProps = {|
  fetchMenues: typeof fetchMenues,
  setSelectedTab: typeof Actions.setSelectedTab,
|};

type Props = {|
  ...StateProps,
  ...DispatchProps,
|};

class OptionDialogs extends React.Component<Props, State> {
  state: State = {};
  componentDidMount() {
    this.props.fetchMenues();
  }
  handleClick(action: string) {
    this.props.setSelectedTab(undefined, action);
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
            {map(services, (href, name) => (
              <a key={name} href={href} target="_blank" rel="noopener noreferrer">
                <Button>{name}</Button>
              </a>
            ))}
          </div>
        </div>

        <OptionDialog handleRequestClose={this.handleRequestClose} open={this.state.open} />
      </div>
    );
  }
}

export default connect<AppState, Function, {||}, StateProps, DispatchProps>(
  state => ({
    services: state.menu.services,
  }),
  {
    fetchMenues,
    setSelectedTab: Actions.setSelectedTab,
  }
)(OptionDialogs);
