// @flow
/* eslint import/no-webpack-loader-syntax: 0 */
import { updateDevice } from 'actions/device';
import Primus from './external/primusClient';

const primus = Primus.connect(PRIMUS || 'http://localhost:3001');

export function setupPrimus(store: *) {
  primus.on('data', deviceId => {
    store.dispatch(updateDevice(deviceId));
  });
}

export const socketUpdate = (deviceId: any) => {
  primus.write(deviceId);
};
