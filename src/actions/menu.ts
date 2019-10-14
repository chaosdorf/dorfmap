import { createAction } from 'deox';
import { ThunkResult } from 'AppState';
import axios from 'axios';

export type MenuItem = {
  name: string;
  entries: string[];
};

const Actions = {
  fetchedMenues: createAction('FETCHED_MENUES', resolve => (p: MenuItem[]) =>
    resolve(p)
  ),
  setSelectedTab: createAction('SET_SELECTED_TAB', resolve => (value: string) =>
    resolve(value)
  ),
};

export default Actions;

export const fetchMenues = (): ThunkResult => async dispatch => {
  const menues = (await axios.get('/ajax/menu.json')).data;

  dispatch(Actions.fetchedMenues(menues));
};
