/* eslint import/prefer-default-export: 0 */
// @flow
import { createSelector } from 'reselect';
import type { AppState } from 'AppState';

const device = (state: AppState) => state.device;
const devicesSelector = createSelector(device, d => d.devices);
const layerSelector = createSelector(device, d => d.layer);

export const filteredDevices = createSelector(devicesSelector, layerSelector, (devices, layer) =>
  devices.filter(l => l.layer === layer)
);
