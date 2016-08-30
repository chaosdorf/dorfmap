import 'imports?this=>window&define=>false!./external/primusClient';
import { updateDevice } from './Actions/devices';

const primus = global.Primus.connect(PRIMUS);

primus.on('update', deviceId => {
  updateDevice(deviceId);
});

export const socketUpdate = deviceId => {
  primus.emit('update', deviceId);
};
