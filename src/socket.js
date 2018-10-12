// @flow
/* eslint import/no-webpack-loader-syntax: 0 */
import { updateDevice } from 'actions/device';
import io from 'socket.io-client';

const socket = io.connect(SOCKET_URL || 'http://localhost:3001');

export function setupSocket(store: *) {
  socket.on('message', deviceId => {
    store.dispatch(updateDevice(deviceId));
  });
}

export const socketUpdate = (deviceId: any) => {
  socket.send(deviceId);
};
