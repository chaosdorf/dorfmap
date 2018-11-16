// @flow
import { createAction } from 'redux-actions';
import axios from 'axios';
import type { ThunkAction } from 'AppState';

export type MenuItem = {|
  name: string,
  entries: string[],
|};

export const Actions = {
  fetchedMenues: createAction<string, MenuItem[]>('FETCHED_MENUES'),
  setSelectedTab: createAction<string, [?SyntheticEvent<>, string], string>('SET_SELECTED_TAB', (e, value) => value),
};

export const fetchMenues: ThunkAction<> = () => async dispatch => {
  const menues = (await axios.get('/ajax/menu.json')).data;

  dispatch(Actions.fetchedMenues(menues));
};
