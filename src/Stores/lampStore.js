import { Map } from 'immutable';

class LampStore extends EventEmitter {
  devices = Map()
  layer = 'control'
  constructor() {
    super();
    this.getAll();
  }
  async getAll() {
    const lamps = await axios.get('http://localhost:3000/status/devices.json');
    this.devices = Map(lamps.data);
    this.emit('lamps', this.filterLamps(this.devices.toJS(), this.layer));
  }
  filterLamps(lamps, layer) {
    return _.filter(lamps, l => {
      return l.type !== 'rtext' && l.layer === layer;
    });
  }
  getImage(lamp) {
    if (lamp.image.match(/o[fn]f?/)) {
      return lamp.image;
    }
    if (lamp.name === 'hackcenter_blau') {
      return lamp.image.replace('.png', lamp.status === 1 ? '_on.png' : '_off.png');
    }
    if (lamp.type === 'light_au') {
      return lamp.image.replace('light', lamp.status === 1 ? 'light_on' : 'light_off');
    }
    let replace;
    switch (lamp.status) {
      case 0:
      replace = '_off.png';
      break;
      case 1:
      replace = '_on.png';
      break;
      default:
      replace = '.png';
      break;
    }
    return lamp.image.replace('.png', replace);
  }
  getDuplicate(duplicate, lamp) {
    const dup = _.cloneDeep(lamp);
    dup.duplicates = null;
    _.extend(dup, duplicate);
    return dup;
  }
  async toggleLamp(lamp) {
    const result = await axios.post('http://localhost:3000/action', {
      action: 'toggle',
      device: lamp.name
    });
    console.log(result);
  }
  updateDevice(device) {
    this.devices = this.devices.set(device.name, device);
    this.emit('deviceUpdate', device);
  }
}

export default new LampStore();
