// @flow
import { action, computed, observable } from 'mobx';
import { Map } from 'immutable';
import { socketUpdate } from '../primus';
import _ from 'lodash';
import axios from 'axios';

type Color = { name: string, raw_string: string };
type Presets = {
  active?: Color,
  colors: Color[],
  presets: Color[],
};

export default class DeviceStore {
  @computed
  get devices(): Map<string, Lamp> {
    return this.allDevices.filter(l => l.layer === this.layer);
  }
  @observable allDevices: Map<string, Lamp> = Map();
  @observable layer = 'control';
  constructor() {
    this.fetchDevices();
  }
  @observable presets: Map<string, Presets> = Map();
  @action
  async fetchDevices() {
    const devices = (await axios.get('/status/devices.json')).data;
    this.allDevices = Map();
    _.forEach(devices, d => {
      this.allDevices = this.allDevices.set(d.name, d);
      if (d.status === 1) {
        // eslint-disable-next-line
        d.rate_delay = 0;
      } else if (d.rate_delay > 0) {
        // setTimeout(() => reduceDelay(d), 1000);
      }
    });
  }
  @action
  async toggleDevice(device: Lamp) {
    const updatedDevice = (await axios.post('/action', {
      action: 'toggle',
      device: device.name,
    })).data;
    socketUpdate(device.name);
    if (updatedDevice.status === 1) {
      // eslint-disable-next-line
      updatedDevice.rate_delay = 0;
      // eslint-disable-next-line
    }
    this.allDevices = this.allDevices.set(
      device.name,
      Object.assign({}, device, updatedDevice)
    );
  }
  @action
  async updateDevice(deviceName: string) {
    const { status } = (await axios.get(`/get/${deviceName}.json`)).data;
    this.allDevices = this.allDevices.set(deviceName, status);
  }
  @action
  async fetchPresets(device: Lamp) {
    if (!this.presets.has(device.name)) {
      const presets: Presets = await axios.get(
        `/ajax/blinkencontrol?device=${device.name}`
      );
      this.presets = this.presets.set(device.name, presets);
    }
  }
  @action
  setActivePreset(deviceName: string, active: string) {
    const presets = this.presets.get(deviceName);
    if (!presets) {
      return;
    }
    const activePreset = presets.presets.find(c => c.raw_string === active);
    presets.active = activePreset;
    this.presets = this.presets.set(deviceName, presets);
  }
  async savePreset(deviceName: string) {
    const presets = this.presets.get(deviceName);
    if (!presets || !presets.active) {
      return;
    }
    await axios.post('/ajax/blinkencontrol', {
      device: deviceName,
      // eslint-disable-next-line
      raw_string: presets.active.raw_string,
    });
  }
  @action
  changeLayer(layer: string) {
    this.layer = layer;
  }
  async executePreset(preset: string) {
    await axios.post('/action', {
      action: 'preset',
      preset,
    });
    this.fetchDevices();
  }
  async executeShortcut(shortcut: string) {
    await axios.post('/action', {
      action: 'shortcut',
      shortcut,
    });
    this.fetchDevices();
  }
}
