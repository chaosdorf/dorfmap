// @flow
import * as Actions from 'actions/menu';
import { handleActions } from 'redux-actions';
import { Map } from 'immutable';

export type State = {
  menu: Map<?string, any>,
  services: Map<string, string>,
};

const defaultState: State = {
  menu: Map(),
  services: Map({
    mete: 'https://mete.chaosdorf.space',
    labello: 'http://labello.chaosdorf.space',
    mpd: 'https://mpd.chaosdorf.space',
    pulseWeb: 'https://pulseweb.chaosdorf.space',
    pizza: 'https://pizza.chaosdorf.space',
  }),
};

export default handleActions(
  {
    [String(Actions.fetchMenues)]: (state: State, { payload, error }) => {
      if (error) {
        return state;
      }
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
