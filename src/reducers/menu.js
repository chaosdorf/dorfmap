// @flow
import * as Actions from 'actions/menu';
import { handleActions } from 'redux-actions';

export type State = {
  menu: Object,
  services: { [key: string]: string },
  selectedTab: string,
};

const defaultState: State = {
  menu: {},
  services: {
    mete: 'https://mete.chaosdorf.space',
    labello: 'http://labello.chaosdorf.space',
    mpd: 'https://ympd.chaosdorf.space',
    pulseWeb: 'https://pulseweb.chaosdorf.space',
    pizza: 'https://pizza.chaosdorf.space',
  },
  selectedTab: 'actions',
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
      const menu = {};

      for (const m of payload) {
        menu[m.name] = m.entries;
      }

      return {
        ...state,
        menu,
      };
    },
  },
  defaultState
);
