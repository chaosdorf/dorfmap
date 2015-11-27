import _ from 'lodash';
import axios from 'axios';
import { createAction } from 'redux-actions';

export const fetchMenues = createAction('FETCH_MENUES', async () => {
  const rawMenues = await axios.get('/ajax/menu.json');
  return _.zipObject(_.pluck(rawMenues, 'name'), _.pluck(rawMenues, 'entries'));
});
