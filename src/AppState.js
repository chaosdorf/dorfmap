// @flow
import type { State as DeviceState } from 'reducers/device';
import type { State as MenuState } from 'reducers/menu';

export type AppState = {
  menu: MenuState,
  device: DeviceState,
};

export type ThunkAction<A1 = *, A2 = *, A3 = *, A4 = *, A5 = *, A6 = *, A7 = *, A8 = *, A9 = *> = (
  A1,
  A2,
  A3,
  A4,
  A5,
  A6,
  A7,
  A8,
  A9
) => (dispatch: Function, () => AppState) => any;
