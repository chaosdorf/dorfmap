import 'imports?this=>window&define=>false!./external/primusClient';
import { updateDevice } from './Actions/devices';

const config = require(CONFIGPATH);
const primus = global.Primus.connect(config.primusLocation);

primus.on('update', deviceId => {
  updateDevice(deviceId);
});

export const socketUpdate = deviceId => {
  primus.emit('update', deviceId);
};
