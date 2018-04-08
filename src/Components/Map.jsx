// @flow
import { connect } from 'react-redux';
import { fetchDevices } from 'actions/device';
import { filteredDevices } from 'selector/device';
import LampComponent from './Lamp';
import React from 'react';
import styles from './Map.scss';
import type { AppState } from 'AppState';

type ReduxProps = {
  devices: $PropertyType<$PropertyType<AppState, 'device'>, 'devices'>,
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
      <div className={styles.wrapper}>
        {devices
          .map((lamp, key) => <LampComponent key={key} lamp={lamp} />)
          .toList()
          .toArray()}
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
