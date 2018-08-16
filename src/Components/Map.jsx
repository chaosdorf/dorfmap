// @flow
import './Map.scss';
import { connect } from 'react-redux';
import { fetchDevices } from 'actions/device';
import { filteredDevices } from 'selector/device';
import LampComponent, { type Lamp } from './Lamp';
import React from 'react';
import type { AppState } from 'AppState';

type ReduxProps = {
  devices: Lamp[],
};

type Props = ReduxProps & {
  fetchDevicesProp: typeof fetchDevices,
};

class DMap extends React.Component<Props> {
  componentDidMount() {
    this.props.fetchDevicesProp();
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

export default connect(
  (state: AppState): ReduxProps => ({
    devices: filteredDevices(state),
  }),
  {
    fetchDevicesProp: fetchDevices,
  }
)(DMap);
