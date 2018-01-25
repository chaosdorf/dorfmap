// @flow
import { createAction } from 'redux-actions';
import axios from 'axios';

// eslint-disable-next-line
export const fetchMenues = createAction('FETCH_MENUES', async () => (await axios.get('/ajax/menu.json')).data);
