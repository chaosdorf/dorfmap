/* eslint camelcase: 0 */
import _ from 'lodash';
import { createAction } from 'redux-actions';
import axios from 'axios';

const reduceDelay = createAction('REDUCE_DELAY', device => {
  device.rate_delay -= 1;
  if (device.rate_delay > 0) {
    setTimeout(() => reduceDelay(device), 1000);
  }
  return device;
});

async function _fetchDevices() {
  const devices = await axios.get('/status/devices.json');
  _.each(devices, d => {
    if (d.status === 1) {
      d.rate_delay = 0;
    } else if (d.rate_delay > 0) {
      setTimeout(() => reduceDelay(d), 1000);
    }
  });
  return Object.keys(devices).map(key => devices[key]);
}

export const changeLayer = createAction('CHANGE_LAYER', layer => layer);

export const fetchDevices = createAction('FETCH_DEVICES', _fetchDevices);

export const toggleDevice = createAction('TOGGLE_DEVICE', async (device) => {
  const updatedDevice = await axios.post('/action', {
    action: 'toggle',
    device: device.name,
  });
  if (updatedDevice.status === 1) {
    updatedDevice.rate_delay = 0;
  } else {
    setTimeout(() => reduceDelay(device), 1000);
  }
  return Object.assign(device, updatedDevice);
});

export const fetchSegmentModes = createAction('FETCH_SEGMENT_MODES', async () => {
  const modes = await axios.get('/ajax/charwrite.json');
  return _.zipObject(_.pluck(modes, 'name'), _.pluck(modes, 'description'));
});

export const changeSegment = createAction('CHANGE_SEGMENT', async (segment, mode) => {
  await axios.post('/ajax/charwrite', {
    device: segment.name,
    text: mode,
  });
  segment.charwrite_text = mode;
  return segment;
});

export const fetchPresets = createAction('FETCH_PRESETS', async (lamp) => {
  return {
    name: lamp.name,
    presets: await axios.get(`/ajax/blinkencontrol?device=${lamp.name}`),
  };
});

export const saveBlinkenlight = createAction('SAVE_BLINKENLIGHT', async (lamp, mode) => {
  return {
    name: lamp.name,
    presets: await axios.post('/ajax/blinkencontrol', {
      device: lamp.name,
      raw_string: mode,
    }),
  };
});

export const executePreset = createAction('EXECUTE_PRESET', async preset => {
  await axios.post('/action', {
    action: 'preset',
    preset,
  });
  return await _fetchDevices();
});

export const executeShortcut = createAction('EXECUTE_SHORTCUT', async shortcut => {
  await axios.post('/action', {
    action: 'shortcut',
    shortcut,
  });
  return await _fetchDevices();
});
