/* eslint no-underscore-dangle: 0 */
import { AppState, ThunkResult } from 'AppState';
import { createAction } from 'deox';
import { Lamp } from 'Components/Lamp';
import { Presets } from 'reducers/device';
import { socketUpdate } from '../socket';
import axios from 'axios';

type Devices = AppState['device']['devices'];

const Actions = {
  fetchedDevices: createAction('FETCHED_DEVICES', resolve => (p: Devices) =>
    resolve(p)
  ),
  fetchedDevicesError: createAction(
    'FETCHED_DEVICES_ERROR',
    resolve => (p: Error) => resolve(p)
  ),
  toggledDevice: createAction('TOGGLED_DEVICE', resolve => (p: Lamp) =>
    resolve(p)
  ),
  setLayer: createAction('SET_LAYER', resolve => (p: string) => resolve(p)),
  fetchedPresets: createAction(
    'FETCHED_PRESETS',
    resolve => (p: { deviceName: string; presets: Presets }) => resolve(p)
  ),
  setActivePreset: createAction(
    'SET_ACTIVE_PRESET',
    resolve => (p: { deviceName: string; value: string }) => resolve(p)
  ),
};

export default Actions;

export const fetchDevices = (): ThunkResult => async dispatch => {
  try {
    const devices: Devices = (await axios.get('/status/devices.json')).data;

    dispatch(Actions.fetchedDevices(devices));
  } catch (e) {
    dispatch(Actions.fetchedDevicesError(e));
  }
};

export const executePreset = (
  preset: string
): ThunkResult => async dispatch => {
  await axios.post('/action', {
    action: 'preset',
    preset,
  });
  socketUpdate('__all__');
  await dispatch(fetchDevices());
};

export const executeShortcut = (
  shortcut: string
): ThunkResult => async dispatch => {
  await axios.post('/action', {
    action: 'shortcut',
    shortcut,
  });
  socketUpdate('__all__');
  await dispatch(fetchDevices());
};

export const toggleDevice = (device: Lamp): ThunkResult => async dispatch => {
  const updatedDevice: Lamp = (await axios.post('/action', {
    action: 'toggle',
    device: device.name,
  })).data;

  if (updatedDevice.status === 1) {
    // eslint-disable-next-line
    updatedDevice.rate_delay = 0;
  }
  socketUpdate(device.name);
  dispatch(Actions.toggledDevice(updatedDevice));
  await dispatch(fetchDevices());
};

export const updateDevice = (
  deviceName: string
): ThunkResult => async dispatch => {
  const updatedDevice: Lamp = (await axios.get(`/get/${deviceName}.json`)).data
    .status;

  dispatch(Actions.toggledDevice(updatedDevice));
};

export const fetchPresets = (device: Lamp): ThunkResult => async dispatch => {
  const presets = (await axios.get(
    `/ajax/blinkencontrol?device=${device.name}`
  )).data;

  dispatch(
    Actions.fetchedPresets({
      deviceName: device.name,
      presets,
    })
  );
};

export const savePreset = (
  device: string,
  raw_string: string
): ThunkResult => () =>
  axios.post('/ajax/blinkencontrol', {
    device,
    raw_string,
  });
