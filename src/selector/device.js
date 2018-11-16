// @flow
/* eslint import/prefer-default-export: 0 */
import { createSelector } from 'reselect';
import { filter } from 'lodash';
import type { AppState } from 'AppState';
import type { Lamp } from 'Components/Lamp';

type DeviceState = $PropertyType<AppState, 'device'>;
type Devices = $PropertyType<DeviceState, 'devices'>;
const device = (state: AppState) => state.device;
const devicesSelector = createSelector<AppState, void, Devices, DeviceState>(
  device,
  d => d.devices
);
const layerSelector = createSelector<AppState, void, string, DeviceState>(
  device,
  d => d.layer
);

export const filteredDevices = createSelector<AppState, void, Lamp[], Devices, string>(
  devicesSelector,
  layerSelector,
  (devices, layer) => filter(devices, d => d.layer === layer)
);
