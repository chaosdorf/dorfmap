/* @flow */

import { Map } from 'immutable';
import { baseHost } from 'config';
import EventEmitter from 'eventemitter3';
import axios from 'axios';

class LampStore extends EventEmitter {
  devices = Map()
  layer = 'control'
  constructor() {
    super();
    this.getAll();
  }
  emitLamps() {
    this.emit('lamps', this.filterLamps(this.devices, this.layer));
  }
  async getAll() {
    const lamps = await axios.get(`${baseHost}/status/devices.json`);
    this.devices = Map(lamps.data);
    await this.emitLamps();
  }
  updateLayer(layer) {
    this.layer = layer;
    this.emitLamps();
  }
  filterLamps(lamps = this.devices, layer = this.layer) {
    return lamps.filter(l => l.layer === layer);
  }
  getImage(lamp: Object) {
    let status = '';
    switch (lamp.status) {
      case 0:
      case '0':
      status = '_off';
      break;
      case 1:
      case '1':
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
      device: lamp.name,
    })).data;
    lamp.status = newStatus.status;
    lamp.auto = newStatus.auto;
    /* eslint-disable camelcase */
    lamp.rate_delay = newStatus.rate_delay;
    /* eslint-enable camelcase */
    this.emit('deviceUpdate', lamp);
  }
  updateDevice(device) {
    this.devices = this.devices.set(device.name, device);
    this.emit('deviceUpdate', device);
  }
  async executePreset(preset) {
    await axios.post(`${baseHost}/action`, {
      action: 'preset',
      preset,
    });
    this.getAll();
  }
  async executeShortcut(shortcut) {
    await axios.post(`${baseHost}/action`, {
      action: 'shortcut',
      shortcut,
    });
    this.getAll();
  }
}

export default new LampStore();
