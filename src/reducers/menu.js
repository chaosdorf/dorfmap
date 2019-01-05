// @flow
import { Actions } from 'actions/menu';
import { type ActionType, handleActions } from 'redux-actions';

export type State = {|
  menu: { [key: string]: string[] },
  services: { [key: string]: string },
  selectedTab: string,
|};

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

export default handleActions<State, *>(
  {
    [String(Actions.setSelectedTab)]: (state, { payload }: ActionType<typeof Actions.setSelectedTab>) => ({
      ...state,
      selectedTab: payload,
    }),
    [String(Actions.fetchedMenues)]: (state: State, { payload }: ActionType<typeof Actions.fetchedMenues>) => {
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
