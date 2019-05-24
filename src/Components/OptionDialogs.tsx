import './OptionDialogs.scss';
import { AppState } from 'AppState';
import { connect, ResolveThunks } from 'react-redux';
import { map } from 'lodash';
import Actions, { fetchMenues } from 'actions/menu';
import Button from '@material-ui/core/Button';
import OptionDialog from './OptionDialog';
import React from 'react';

type State = {
  open?: boolean,
};

type StateProps = {
  services: AppState['menu']['services'],
};

type DispatchProps = ResolveThunks<{
  fetchMenues: typeof fetchMenues,
  setSelectedTab: typeof Actions.setSelectedTab,
}>;

type Props = StateProps & DispatchProps;

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
      <>
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

        {this.state.open && <OptionDialog handleRequestClose={this.handleRequestClose} />}
      </>
    );
  }
}

export default connect<StateProps, DispatchProps, {}, AppState>(
  state => ({
    services: state.menu.services,
  }),
  {
    fetchMenues,
    setSelectedTab: Actions.setSelectedTab,
  }
)(OptionDialogs);
