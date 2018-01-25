// @flow
import * as Actions from 'actions/menu';
import { handleActions } from 'redux-actions';
import { Map } from 'immutable';

export type State = {
  menu: Map<string, any>,
};

const defaultState: State = {
  menu: Map(),
};

export default handleActions(
  {
    [String(Actions.fetchMenues)]: (state: State, { payload }) => {
      let menu = Map();

      for (const m of payload) {
        menu = menu.set(m.name, m.entries);
      }

      return {
        ...state,
        menu,
      };
    },
  },
  defaultState
);
