/* eslint no-underscore-dangle: 0 */
// @flow
import { createAction } from 'redux-actions';
import { socketUpdate } from '../socket';
import axios from 'axios';
import type { AppState, ThunkAction } from 'AppState';
import type { Lamp } from 'Components/Lamp';

// const createAction = <PL>(
//   type: string
// ): (PL => {
//   toString: () => string,
//   type: string,
//   payload: PL,
// }) => payload => ({
//   toString: () => type,
//   type,
//   payload,
// });

type Devices = $PropertyType<$PropertyType<AppState, 'device'>, 'devices'>;

const _fetchDevices = async (dispatch: Function) => {
  try {
    const devices: Devices = (await axios.get('/status/devices.json')).data;

    dispatch(Actions.fetchedDevices(devices));
  } catch (e) {
    dispatch(Actions.fetchedDevicesError(e));
  }
};

export const Actions = {
  fetchedDevices: createAction<string, Devices>('FETCHED_DEVICES'),
  fetchedDevicesError: createAction<string, Error>('FETCHED_DEVICES_ERROR'),
  toggledDevice: createAction<string, Lamp>('TOGGLED_DEVICE'),
  setLayer: createAction<string, string>('SET_LAYER'),
  fetchedPresets: createAction<string, Object>('FETCHED_PRESETS'),
  setActivePreset: createAction<string, { deviceName: string, value: string }>('SET_ACTIVE_PRESET'),
};

export const fetchDevices: ThunkAction<> = () => _fetchDevices;

export const executePreset: ThunkAction<string> = preset => async dispatch => {
  await axios.post('/action', {
    action: 'preset',
    preset,
  });
  socketUpdate('__all__');
  await _fetchDevices(dispatch);
};

export const executeShortcut: ThunkAction<string> = shortcut => async dispatch => {
  await axios.post('/action', {
    action: 'shortcut',
    shortcut,
  });
  socketUpdate('__all__');
  await _fetchDevices(dispatch);
};

export const toggleDevice: ThunkAction<Lamp> = device => async dispatch => {
  const updatedDevice = (await axios.post('/action', {
    action: 'toggle',
    device: device.name,
  })).data;

  if (updatedDevice.status === 1) {
    // eslint-disable-next-line
    updatedDevice.rate_delay = 0;
  }
  socketUpdate(device.name);
  dispatch(Actions.toggledDevice(updatedDevice));
};

export const updateDevice: ThunkAction<string> = deviceName => async dispatch => {
  const updatedDevice = (await axios.get(`/get/${deviceName}.json`)).data;

  dispatch(Actions.toggledDevice(updatedDevice));
};

export const fetchPresets: ThunkAction<Lamp> = device => async dispatch => {
  const presets = (await axios.get(`/ajax/blinkencontrol?device=${device.name}`)).data;

  dispatch(
    Actions.fetchedPresets({
      deviceName: device.name,
      presets,
    })
  );
};

export const savePreset: ThunkAction<string, string> = (device, raw_string) => () =>
  axios.post('/ajax/blinkencontrol', {
    device,
    raw_string,
  });
