// @flow
/* eslint import/no-webpack-loader-syntax: 0 */
import { updateDevice } from 'actions/device';

const url = SOCKET_URL || 'http://localhost:3001';

export function setupSocket(store: *) {
  if (global.EventSource) {
    const stream = new global.EventSource(`${url}/events`);

    stream.onmessage = e => {
      if (e.data !== 'PING') {
        store.dispatch(updateDevice(e.data));
      }
    };
  }
}

export const socketUpdate = (deviceId: any) => {
  fetch(`${url}/fire?id=${deviceId}`);
};
