import _ from 'lodash';
import { Map } from 'immutable';
import lampStore from './lampStore.js';
import EventEmitter from 'eventemitter';
import axios from 'axios';

class menuStore extends EventEmitter {
  menu = Map()
  charwrite = Map()
  constructor() {
    super();
    this.getMenuEntries();
    this.getCharwriteModes();
  }
  async getMenuEntries() {
    const menu = (await axios.get(`/ajax/menu.json`));
    _.each(menu, menuEntry => {
      this.menu = this.menu.set(menuEntry.name, menuEntry.entries);
    });
    this.emit('menuEntries', this.menu.toJS());
  }
  async getCharwriteModes() {
    const modes = (await axios.get(`/ajax/charwrite.json`));
    _.each(modes, mode => {
      this.charwrite = this.charwrite.set(mode.name, mode.description);
    });
    this.emit('charwriteModes', this.charwrite.toJS());
  }
  async saveCharwrite(lamp, mode) {
    const r = (await axios.post(`/ajax/charwrite`, {
      device: lamp.name,
      text: mode,
    }));
    await lampStore.getAll();
    return r;
  }
  async getBlinkenlight(lamp) {
    return (await axios.get(`/ajax/blinkencontrol?device=${lamp}`));
  }
  async saveBlinkenlight(lamp, preset) {
    const r = (await axios.post(`/ajax/blinkencontrol`, {
      device: lamp.name,
      /* eslint-disable camelcase */
      raw_string: preset,
      /* eslint-enable camelcase */
    }));
    await lampStore.getAll();
    return r;
  }
}

export default new menuStore();
