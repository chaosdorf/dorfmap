import { filter } from 'lodash';
import { useMemo } from 'react';
import useReduxState from './useReduxState';

export default () => {
  const devices = useReduxState(state => state.device.devices);
  const layer = useReduxState(state => state.device.layer);

  return useMemo(() => filter(devices, d => d.layer === layer), [
    devices,
    layer,
  ]);
};
