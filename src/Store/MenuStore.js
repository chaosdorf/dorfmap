// @flow
import { action, observable } from 'mobx';
import { Map } from 'immutable';
import axios from 'axios';

export default class MenuStore {
  @observable menu = Map();
  @action async fetchMenues() {
    const rawMenues = await axios.get('/ajax/menu.json');
    for (const m of rawMenues) {
      this.menu = this.menu.set(m.name, m.entries);
    }
  }
}
