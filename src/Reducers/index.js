import { handleActions } from 'redux-actions';

function updateDevices(state) {
  state.allDevices = state.allDevices.splice(0);
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
    const deviceIndex = state.allDevices.findIndex(d => d.name === payload.name);
    if (deviceIndex !== -1) {
      /* eslint-disable camelcase */
      state.allDevices[deviceIndex].rate_delay = payload.rate_delay;
      /* eslint-enable camelcase */
      state.allDevices[deviceIndex].status = payload.status;
      return updateDevices(state);
    }
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
  allDevices: [],
  devices: [],
  layer: 'control',
  menues: {},
  presets: {},
  segmentModes: {},
});
