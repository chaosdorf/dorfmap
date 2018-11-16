// @flow
/* eslint import/no-webpack-loader-syntax: 0 */
import { fetchDevices, updateDevice } from 'actions/device';

const url = SOCKET_URL || 'http://localhost:3001';

export function setupSocket(store: *) {
  if (global.EventSource) {
    try {
      const stream = new global.EventSource(`${url}/events`);

      stream.onmessage = e => {
        if (e.data !== 'PING') {
          if (e.data === '__all__') {
            store.dispatch(fetchDevices());
          } else {
            store.dispatch(updateDevice(e.data));
          }
        }
      };
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Real time updates not working');
    }
  } else {
    // eslint-disable-next-line no-console
    console.warn('Real time updates not working');
  }
}

export const socketUpdate = (deviceId: any) => {
  fetch(`${url}/fire?id=${deviceId}`);
};
