import './Map.scss';
import { AppState } from 'AppState';
import { connect, ResolveThunks } from 'react-redux';
import { fetchDevices } from 'actions/device';
import { filteredDevices } from 'selector/device';
import LampComponent, { Lamp } from './Lamp';
import React from 'react';

type StateProps = {
  devices: Lamp[],
};
type DispatchProps = ResolveThunks<{
  fetchDevices: typeof fetchDevices,
}>;

type Props = StateProps & DispatchProps;

class DMap extends React.Component<Props> {
  componentDidMount() {
    this.props.fetchDevices();
  }
  render() {
    const { devices } = this.props;

    return (
      <div className="Map">
        {devices.map(lamp => (
          <LampComponent key={lamp.name} lamp={lamp} />
        ))}
      </div>
    );
  }
}

export default connect<StateProps, DispatchProps, {}, AppState>(
  state => ({
    devices: filteredDevices(state),
  }),
  {
    fetchDevices,
  }
)(DMap);
