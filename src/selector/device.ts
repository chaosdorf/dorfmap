/* eslint import/prefer-default-export: 0 */
import { AppState } from 'AppState';
import { createSelector } from 'reselect';
import { filter } from 'lodash';

const device = (state: AppState) => state.device;
const devicesSelector = createSelector(
  device,
  d => d.devices
);
const layerSelector = createSelector(
  device,
  d => d.layer
);

export const filteredDevices = createSelector(
  devicesSelector,
  layerSelector,
  (devices, layer) => filter(devices, d => d.layer === layer)
);
