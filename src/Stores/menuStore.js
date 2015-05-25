import { baseHost } from '../config';
import { Map } from 'immutable';

class menuStore extends EventEmitter {
  menu = Map()
  constructor() {
    super();
    this.getMenuEntries();
  }
  async getMenuEntries() {
    const menu = (await axios.get(`${baseHost}/ajax/menu.json`)).data;
    _.each(menu, menuEntry => {
      this.menu = this.menu.set(menuEntry.name, menuEntry.entries);
    });
  }
}

export default new menuStore();
