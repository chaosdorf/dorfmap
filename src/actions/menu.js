// @flow
import { createAction } from 'redux-actions';
import axios from 'axios';

export const fetchMenues = createAction('FETCH_MENUES', async () => (await axios.get('/ajax/menu.json')).data);

export const setSelectedTab = createAction('SET_SELECTED_TAB');
