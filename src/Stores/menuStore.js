import { baseHost } from '../config';
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
    const menu = (await axios.get(`${baseHost}/ajax/menu.json`)).data;
    _.each(menu, menuEntry => {
      this.menu = this.menu.set(menuEntry.name, menuEntry.entries);
    });
    this.emit('menuEntries', this.menu.toJS());
  }
  async getCharwriteModes() {
    const modes = (await axios.get(`${baseHost}/ajax/charwrite.json`)).data;
    _.each(modes, mode => {
      this.charwrite = this.charwrite.set(mode.name, mode.description);
    });
    this.emit('charwriteModes', this.charwrite.toJS());
  }
  async saveCharwrite(lamp, mode) {
    const r = (await axios.post(`${baseHost}/ajax/charwrite`, {
      device: lamp.name,
      text: mode
    })).data;
    await lampStore.getAll();
    return r;
  }
  async getBlinkenlight(lamp) {
    return (await axios.get(`${baseHost}/ajax/blinkencontrol?device=${lamp}`)).data;
  }
  async saveBlinkenlight(lamp, preset) {
    const r = (await axios.post(`${baseHost}/ajax/blinkencontrol`, {
      device: lamp.name,
      raw_string: preset
    }));
    await lampStore.getAll();
    return r;
  }
}

export default new menuStore();
