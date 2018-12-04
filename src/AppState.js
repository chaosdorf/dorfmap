// @flow
import type { State as DeviceState } from 'reducers/device';
import type { State as MenuState } from 'reducers/menu';

export type AppState = {
  menu: MenuState,
  device: DeviceState,
};

export type InnerThunkAction = (dispatch: Function, () => AppState) => Promise<any>;
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
) => InnerThunkAction;

// eslint-disable-next-line no-unused-vars
type _ActionType<R, Fn: (...rest: R) => InnerThunkAction> = (...rest: R) => Promise<any>;
export type ActionType<Fn> = _ActionType<*, Fn>;
