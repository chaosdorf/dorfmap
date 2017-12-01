// @flow
/* eslint import/no-webpack-loader-syntax: 0 */
import 'imports-loader?this=>window&define=>false!./external/primusClient';
import type DeviceStore from 'Store/DeviceStore';

const primus = global.Primus.connect(PRIMUS);

export function setupPrimus(deviceStore: DeviceStore) {
  primus.on('update', deviceId => {
    deviceStore.updateDevice(deviceId);
  });
}

export const socketUpdate = (deviceId: any) => {
  primus.emit('update', deviceId);
};
