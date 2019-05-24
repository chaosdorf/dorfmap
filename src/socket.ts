/* eslint import/no-webpack-loader-syntax: 0 */
import { fetchDevices } from 'actions/device';

// @ts-ignore
// eslint-disable-next-line no-undef
const url = SOCKET_URL || 'http://localhost:3001';

export function setupSocket(store: any) {
  // @ts-ignore
  if (global.EventSource) {
    try {
      const stream = new EventSource(`${url}/events`);

      stream.onmessage = (e: any) => {
        if (e.data !== 'PING') {
          // We update all because we have hackcenter_weiß and hackcenter_blau - same lamp, different setting
          // if (e.data === '__all__') {
          //   store.dispatch(fetchDevices());
          // } else {
          //   store.dispatch(updateDevice(e.data));
          // }
          store.dispatch(fetchDevices());
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
