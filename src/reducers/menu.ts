import { createReducer } from 'deox';
import Actions from 'actions/menu';

export type State = {
  menu: { [key: string]: string[] };
  services: { [key: string]: string };
  selectedTab: string;
};

const defaultState: State = {
  menu: {},
  services: {
    mete: 'https://mete.chaosdorf.space',
    prittstift: 'https://prittstift.chaosdorf.space',
    labello: 'http://labello.chaosdorf.space',
    mpd: 'https://ympd.chaosdorf.space',
    pulseWeb: 'https://pulseweb.chaosdorf.space',
  },
  selectedTab: 'actions',
};

export default createReducer(defaultState, handle => [
  handle(Actions.setSelectedTab, (state, { payload }) => ({
    ...state,
    selectedTab: payload,
  })),
  handle(Actions.fetchedMenues, (state, { payload }) => {
    const menu: State['menu'] = {};

    for (const m of payload) {
      menu[m.name] = m.entries;
    }

    return {
      ...state,
      menu,
    };
  }),
]);
