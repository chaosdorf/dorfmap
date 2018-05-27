// @flow
import * as Actions from 'actions/device';
import { combineActions, handleActions } from 'redux-actions';
import type { Lamp } from 'Components/Lamp';

type Color = { name: string, raw_string: string };
export type Presets = {
  active?: Color,
  colors: Color[],
  presets: Color[],
};

const defaultState = {
  devices: {},
  layer: 'control',
  presets: {},
};

export type State = {
  devices: { [key: string]: Lamp },
  presets: { [key: string]: Presets },
  layer: string,
};

export default handleActions(
  {
    [combineActions(Actions.fetchDevices, Actions.executePreset, Actions.executeShortcut)]: (
      state: State,
      { payload, error }
    ) => {
      if (error) {
        return state;
      }
      const devices = {};

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
    },
    [String(Actions.setLayer)]: (state: State, { payload }) => ({
      ...state,
      layer: payload,
    }),
    [combineActions(Actions.toggleDevice, Actions.updateDevice)]: (state: State, { payload }: { payload: Lamp }) => ({
      ...state,
      devices: {
        ...state.devices,
        [payload.name]: payload,
      },
    }),
    [String(Actions.fetchPresets)]: (state: State, { payload }) => ({
      ...state,
      presets: {
        ...state.presets,
        [payload.deviceName]: payload.presets,
      },
    }),
    [String(Actions.setActivePreset)]: (state: State, { payload }) => {
      const presets = state.presets[payload.deviceName];

      if (presets) {
        const activePreset = presets.presets.find(c => c.raw_string === payload.value);

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
    },
  },
  defaultState
);
