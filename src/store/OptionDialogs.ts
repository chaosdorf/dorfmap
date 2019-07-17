import axios from 'axios';
import { Module, VuexModule, MutationAction } from 'vuex-module-decorators';
import store from '.';

export interface MenuItem {
  name: string;
  entries: string[];
}

@Module({ dynamic: true, store, name: 'optionDialogs' })
export default class OptionDialogs extends VuexModule {
  menues: MenuItem[] = [];
  services = {
    mete: 'https://mete.chaosdorf.space',
    prittstift: 'https://prittstift.chaosdorf.space',
    labello: 'http://labello.chaosdorf.space',
    mpd: 'https://ympd.chaosdorf.space',
    pulseWeb: 'https://pulseweb.chaosdorf.space',
  };

  @MutationAction({ mutate: ['menues'] })
  async fetchMenues() {
    return {
      menues: (await axios.get('/ajax/menu.json')).data,
    };
  }
}
