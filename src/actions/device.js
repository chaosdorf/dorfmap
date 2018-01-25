/* eslint no-underscore-dangle: 0 */
// @flow
import { createAction } from 'redux-actions';
import { socketUpdate } from '../primus';
import axios from 'axios';

async function _fetchDevices() {
  return (await axios.get('/status/devices.json')).data;
}

export const fetchDevices = createAction('FETCH_DEVICES', () => _fetchDevices());

export const executePreset = createAction('EXECUTE_PRESET', async (preset: string) => {
  await axios.post('/action', {
    action: 'preset',
    preset,
  });

  return _fetchDevices();
});

export const executeShortcut = createAction('EXECUTE_SHORTCUT', async (shortcut: string) => {
  await axios.post('/action', {
    action: 'shortcut',
    shortcut,
  });

  return _fetchDevices();
});

export const toggleDevice = createAction('TOGGLE_DEVICE', async (device: *) => {
  const updatedDevice = (await axios.post('/action', {
    action: 'toggle',
    device: device.name,
  })).data;

  socketUpdate(device.name);
  if (updatedDevice.status === 1) {
    // eslint-disable-next-line
    updatedDevice.rate_delay = 0;
  }

  return updatedDevice;
});

export const updateDevice = createAction('UPDATE_DEVICE', async (deviceName: string) => {
  const { status } = (await axios.get(`/get/${deviceName}.json`)).data;

  return status;
});

export const setLayer = createAction('SET_LAYER', (layer: string) => layer);

export const fetchPresets = createAction('FETCH_PRESETS', async (device: *) => ({
  deviceName: device.name,
  presets: (await axios.get(`/ajax/blinkencontrol?device=${device.name}`)).data,
}));

export const setActivePreset = createAction('SET_ACTIVE_PRESET', (deviceName: string, value: string) => ({
  deviceName,
  value,
}));

export const savePreset = createAction('SAVE_PRESET', (deviceName: string, raw_string: string) =>
  axios.post('/ajax/blinkencontrol', {
    device: deviceName,
    raw_string,
  })
);
