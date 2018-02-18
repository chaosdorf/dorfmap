// @flow
import * as Actions from 'actions/menu';
import { handleActions } from 'redux-actions';
import { Map } from 'immutable';

export type State = {
  menu: Map<?string, any>,
  services: Map<string, string>,
  selectedTab: number,
};

const defaultState: State = {
  menu: Map(),
  services: Map({
    mete: 'https://mete.chaosdorf.space',
    labello: 'http://labello.chaosdorf.space',
    mpd: 'https://ympd.chaosdorf.space',
    pulseWeb: 'https://pulseweb.chaosdorf.space',
    pizza: 'https://pizza.chaosdorf.space',
  }),
  selectedTab: 0,
};

export default handleActions(
  {
    [String(Actions.setSelectedTab)]: (state: State, { payload }) => ({
      ...state,
      selectedTab: payload,
    }),
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
