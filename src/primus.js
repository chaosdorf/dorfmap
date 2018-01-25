// @flow
/* eslint import/no-webpack-loader-syntax: 0 */
import 'imports-loader?this=>window&define=>false!./external/primusClient';
import { updateDevice } from 'actions/device';

const primus = global.Primus.connect(PRIMUS);

export function setupPrimus(store: *) {
  primus.on('update', deviceId => {
    store.dispatch(updateDevice(deviceId));
  });
}

export const socketUpdate = (deviceId: any) => {
  primus.emit('update', deviceId);
};
