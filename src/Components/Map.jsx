// @flow
import { connect } from 'react-redux';
import { fetchDevices } from 'actions/device';
import { filteredDevices } from 'selector/device';
import LampComponent from './Lamp';
import React from 'react';
import type { AppState } from 'AppState';

type ReduxProps = {
  devices: $PropertyType<$PropertyType<AppState, 'device'>, 'devices'>,
};

type Props = ReduxProps & {
  fetchDevicesProp: typeof fetchDevices,
};

class DMap extends React.Component<Props> {
  static style = {
    wrapper: {
      backgroundImage: 'url(/static/images/map.png)',
      width: 2202,
      height: 648,
      marginLeft: 5,
      marginRight: 5,
      position: 'relative',
    },
  };
  componentWillMount() {
    this.props.fetchDevicesProp();
  }
  render() {
    const { devices } = this.props;

    return (
      <div style={DMap.style.wrapper}>
        {devices.map((lamp, key) => <LampComponent key={key} lamp={lamp} />).toList()}
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
