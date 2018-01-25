// @flow
import type { State as DeviceState } from 'reducers/device';
import type { State as MenuState } from 'reducers/menu';

export type AppState = {
  menu: MenuState,
  device: DeviceState,
};
