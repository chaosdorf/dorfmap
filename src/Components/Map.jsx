// @flow
import './Map.scss';
import { connect } from 'react-redux';
import { fetchDevices } from 'actions/device';
import { filteredDevices } from 'selector/device';
import LampComponent, { type Lamp } from './Lamp';
import React from 'react';
import type { AppState } from 'AppState';

type StateProps = {|
  devices: Lamp[],
|};
type DispatchProps = {|
  fetchDevices: typeof fetchDevices,
|};

type Props = {|
  ...StateProps,
  ...DispatchProps,
|};

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

export default connect(
  (state: AppState) => ({
    devices: filteredDevices(state),
  }),
  {
    fetchDevices,
  }
)(DMap);
