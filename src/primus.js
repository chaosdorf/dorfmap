// @flow
/* eslint import/no-webpack-loader-syntax: 0 */
import { updateDevice } from 'actions/device';
import Primus from './external/primusClient';

const primus = Primus.connect(PRIMUS);

export function setupPrimus(store: *) {
  primus.on('update', deviceId => {
    store.dispatch(updateDevice(deviceId));
  });
}

export const socketUpdate = (deviceId: any) => {
  primus.emit('update', deviceId);
};
