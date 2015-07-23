import { Map } from 'immutable';
import { baseHost } from 'config';
import EventEmitter from 'eventemitter';
import axios from 'axios';

class LampStore extends EventEmitter {
  devices = Map()
  layer = 'control'
  constructor() {
    super();
    this.getAll();
  }
  emitLamps() {
    this.emit('lamps', this.filterLamps(this.devices.toJS(), this.layer));
  }
  async getAll() {
    const lamps = await axios.get(`${baseHost}/status/devices.json`);
    this.devices = Map(lamps.data);
    this.emitLamps();
  }
  updateLayer(layer) {
    this.layer = layer;
    this.emitLamps();
  }
  filterLamps(lamps, layer) {
    return _.filter(lamps, l => {
      return l.layer === layer;
    });
  }
  getImage(lamp) {
    let status = '';
    switch (lamp.status) {
      case 0:
      status = '_off';
      break;
      case 1:
      status = '_on';
      break;
    }
    let baseImage;
    switch (lamp.type) {
      case 'light':
      if (lamp.name === 'hackcenter_blau') {
        baseImage = 'hackcenter_blau';
      } else {
        baseImage = 'light';
      }
      break;
      case 'light_au':
      if (lamp.auto) {
        baseImage = 'light_auto';
      } else {
        baseImage = 'light_noauto';
      }
      break;
      default:
      baseImage = lamp.type;
      break;
    }
    return `static/images/${baseImage}${status}.png`;
  }
  getDuplicate(duplicate, lamp) {
    const dup = _.cloneDeep(lamp);
    dup.duplicates = null;
    _.extend(dup, duplicate);
    return dup;
  }
  async toggleLamp(lamp) {
    const newStatus = (await axios.post(`${baseHost}/action`, {
      action: 'toggle',
      device: lamp.name
    })).data;
    lamp.status = newStatus.status;
    lamp.auto = newStatus.auto;
    lamp.rate_delay = newStatus.rate_delay;
    this.emit('deviceUpdate', lamp);
  }
  updateDevice(device) {
    this.devices = this.devices.set(device.name, device);
    this.emit('deviceUpdate', device);
  }
  async executeShortcut(shortcut) {
    await axios.post(`${baseHost}/action`, {
      action: 'shortcut',
      shortcut
    });
    this.getAll();
  }
}

export default new LampStore();
