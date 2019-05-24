import { createReducer } from 'deox';
import { Lamp } from 'Components/Lamp';
import Actions from 'actions/device';

type Color = { name: string, raw_string: string };
export type Presets = {
  active?: Color,
  colors: Color[],
  presets: Color[],
};

const defaultState: State = {
  devices: {},
  layer: 'control',
  presets: {},
};

export type State = {
  devices: { [key: string]: Lamp },
  presets: { [key: string]: Presets },
  layer: string,
};

export default createReducer(defaultState, handle => [
  handle(Actions.fetchedDevices, (state, { payload }) => {
    const devices: any = {};

    Object.keys(payload).forEach(key => {
      const d = payload[key];

      if (d.status === 1) {
        // eslint-disable-next-line
        d.rate_delay = 0;
      }
      devices[d.name] = d;
    });

    return {
      ...state,
      devices,
    };
  }),
  handle(Actions.setLayer, (state, { payload }) => ({
    ...state,
    layer: payload,
  })),
  handle(Actions.toggledDevice, (state, { payload }) => ({
    ...state,
    devices: {
      ...state.devices,
      [payload.name]: payload,
    },
  })),
  handle(Actions.fetchedPresets, (state, { payload }) => ({
    ...state,
    presets: {
      ...state.presets,
      [payload.deviceName]: payload.presets,
    },
  })),
  handle(Actions.setActivePreset, (state, { payload }) => {
    const presets = state.presets[payload.deviceName];

    if (presets) {
      const activePreset = presets.presets.find(c => c.raw_string === payload.value);

      // @ts-ignore
      presets.active = activePreset;

      return {
        ...state,
        presets: {
          ...state.presets,
          [payload.deviceName]: presets,
        },
      };
    }

    return state;
  }),
]);
