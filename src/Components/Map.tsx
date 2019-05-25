import { AppState } from 'AppState';
import { connect, ResolveThunks } from 'react-redux';
import { fetchDevices } from 'actions/device';
import { filteredDevices } from 'selector/device';
import LampComponent, { Lamp } from './Lamp';
import React, { useEffect } from 'react';
import useStyles from './Map.style';

type StateProps = {
  devices: Lamp[];
};
type DispatchProps = ResolveThunks<{
  fetchDevices: typeof fetchDevices;
}>;

type Props = StateProps & DispatchProps;

const DMap = ({ devices, fetchDevices }: Props) => {
  useEffect(() => fetchDevices(), [fetchDevices]);
  const classes = useStyles();

  return (
    <div className={classes.main}>
      {devices.map(lamp => (
        <LampComponent key={lamp.name} lamp={lamp} />
      ))}
    </div>
  );
};

export default connect<StateProps, DispatchProps, {}, AppState>(
  state => ({
    devices: filteredDevices(state),
  }),
  {
    fetchDevices,
  }
)(DMap);
