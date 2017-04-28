// @flow
/* eslint camelcase: 0 */
import { createAction } from 'redux-actions';
import { Map } from 'immutable';
import { socketUpdate } from '../primus';
import _ from 'lodash';
import axios from 'axios';

export const fetchBeamer = createAction('FETCH_BEAMER', async lamp => ({
  name: lamp.name,
  modes: await axios.get(`/ajax/beamer.json?device=${lamp.name}`),
}));

export const saveBeamer = createAction('SAVE_BEAMER', async (lamp, mode) => {
  await axios.post('/ajax/beamer', {
    device: lamp.name,
    action: mode,
  });
  lamp.mode = mode;
  return lamp;
});

export const reduceDelay = createAction(
  'REDUCE_DELAY',
  (device, timeoutAgain = true) => {
    device.rate_delay -= 1;
    if (device.rate_delay > 0 && timeoutAgain) {
      setTimeout(() => reduceDelay(device), 1000);
    }
    return device;
  }
);

async function _fetchDevices() {
  const devices = await axios.get('/status/devices.json');
  let devicesMap = Map();
  _.forEach(devices, d => {
    devicesMap = devicesMap.set(d.name, d);
    if (d.status === 1) {
      d.rate_delay = 0;
    } else if (d.rate_delay > 0) {
      setTimeout(() => reduceDelay(d), 1000);
    }
  });
  return devicesMap;
}

export const changeLayer = createAction('CHANGE_LAYER', layer => layer);

export const fetchDevices = createAction('FETCH_DEVICES', _fetchDevices);

export const updateDevice = createAction('UPDATE_DEVICE', async deviceId => {
  const { status } = await axios.get(`/get/${deviceId}.json`);
  status.name = deviceId;
  return status;
});

export const toggleDevice = createAction('TOGGLE_DEVICE', async device => {
  const updatedDevice = await axios.post('/action', {
    action: 'toggle',
    device: device.name,
  });
  socketUpdate(device.name);
  if (updatedDevice.status === 1) {
    updatedDevice.rate_delay = 0;
  } else if (updateDevice.rate_delay > 0) {
    setTimeout(() => reduceDelay(device), 1000);
  }
  return Object.assign(device, updatedDevice);
});

export const fetchSegmentModes = createAction(
  'FETCH_SEGMENT_MODES',
  async () => {
    const modes = await axios.get('/ajax/charwrite.json');
    const mode = {};
    _.forEach(modes, m => {
      mode[m.name] = m.description;
    });
    return mode;
  }
);

export const changeSegment = createAction(
  'CHANGE_SEGMENT',
  async (segment, mode) => {
    await axios.post('/ajax/charwrite', {
      device: segment.name,
      text: mode,
    });
    segment.charwrite_text = mode;
    return segment;
  }
);

export const fetchPresets = createAction('FETCH_PRESETS', async lamp => ({
  name: lamp.name,
  presets: await axios.get(`/ajax/blinkencontrol?device=${lamp.name}`),
}));

export const saveBlinkenlight = createAction(
  'SAVE_BLINKENLIGHT',
  async (lamp, mode) => ({
    name: lamp.name,
    presets: await axios.post('/ajax/blinkencontrol', {
      device: lamp.name,
      raw_string: mode,
    }),
  })
);

export const executePreset = createAction('EXECUTE_PRESET', async preset => {
  await axios.post('/action', {
    action: 'preset',
    preset,
  });
  return _fetchDevices();
});

export const executeShortcut = createAction(
  'EXECUTE_SHORTCUT',
  async shortcut => {
    await axios.post('/action', {
      action: 'shortcut',
      shortcut,
    });
    return _fetchDevices();
  }
);
