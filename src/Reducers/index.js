/* @flow */
import { handleActions } from 'redux-actions';
import { Map } from 'immutable';

function updateDevices(state, { payload }) {
  state.allDevices = state.allDevices.set(payload.name, payload);
  return {
    allDevices: state.allDevices,
    devices: state.allDevices.filter(d => d.layer === state.layer),
  };
}

function updatePresets(state, { payload }) {
  state.presets[payload.name] = payload.presets;
  return {
    presets: Object.assign(state.presets),
  };
}

function updateDevicesFromPayload(state, { payload }) {
  return {
    allDevices: payload,
    devices: payload.filter(l => l.layer === state.layer),
  };
}

export default handleActions({
  FETCH_MENUES: (state, { payload }) => ({
    menues: payload,
  }),
  FETCH_DEVICES: updateDevicesFromPayload,
  UPDATE_DEVICE: (state, { payload }) => {
    const device = state.allDevices.find(d => d.name === payload.name);
    if (device) {
      /* eslint-disable camelcase */
      device.rate_delay = payload.rate_delay;
      /* eslint-enable camelcase */
      device.status = payload.status;
      return updateDevices(state, { payload: device });
    }
    return undefined;
  },
  CHANGE_LAYER: (state, { payload }) => ({
    layer: payload,
    devices: state.allDevices.filter(l => l.layer === payload),
  }),
  TOGGLE_DEVICE: updateDevices,
  REDUCE_DELAY: updateDevices,
  FETCH_SEGMENT_MODES: (state, { payload }) => ({
    segmentModes: payload,
  }),
  CHANGE_SEGMENT: updateDevices,
  FETCH_PRESETS: updatePresets,
  SAVE_BLINKENLIGHT: updatePresets,
  EXECUTE_PRESET: updateDevicesFromPayload,
  EXECUTE_SHORTCUT: updateDevicesFromPayload,
}, {
  allDevices: Map(),
  devices: Map(),
  layer: 'control',
  menues: {},
  presets: {},
  segmentModes: {},
});
