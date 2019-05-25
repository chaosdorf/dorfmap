import { State as DeviceState } from 'reducers/device';
import { State as MenuState } from 'reducers/menu';
import { Store } from 'redux';
import { ThunkAction } from 'redux-thunk';

export type AppState = {
  menu: MenuState;
  device: DeviceState;
};

type StateThunkAction<R, State> = ThunkAction<R, State, undefined, any>;
export type ThunkResult<R = any> = StateThunkAction<R, AppState>;
export type AppStore = Store<AppState, any>;
