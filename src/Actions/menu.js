// @flow
import { createAction } from 'redux-actions';
import _ from 'lodash';
import axios from 'axios';

export const fetchMenues = createAction('FETCH_MENUES', async () => {
  const rawMenues = await axios.get('/ajax/menu.json');
  const menu = {};
  _.forEach(rawMenues, m => {
    menu[m.name] = m.entries;
  });
  return menu;
});
