import axios from 'axios';
import {
  Module,
  VuexModule,
  MutationAction,
  Mutation,
  Action,
} from 'vuex-module-decorators';
import store from '.';

export interface Lamp {
  status_text?: string;
  rate_delay: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  name: string;
  type: string;
  status: 0 | 1;
  duplicates?: Lamp[];
  layer: string;
  image: string;
  is_writable: number;
}

export interface Color {
  name: string;
  raw_string: string;
}

export interface BlinkenlightOptions {
  active?: Color;
  colors: Color[];
  presets: Color[];
}

@Module({ dynamic: true, store, name: 'devices' })
export default class Devices extends VuexModule {
  devices: Lamp[] = [];
  currentLayer = 'control';
  blinkenlightOptions: { [key: string]: BlinkenlightOptions } = {};

  @Action
  private socketUpdate() {
    try {
      // @ts-ignore
      // eslint-disable-next-line no-undef
      window.fetch(`${SOCKET_URL}/fire?id=__ALL__`);
    } catch (e) {
      // ignore
    }
  }

  @MutationAction({ mutate: ['devices'] })
  async fetchDevices() {
    return {
      devices: Object.values((await axios.get('/status/devices.json')).data),
    };
  }
  @Action
  async toggleDevice(device: string) {
    await axios.post('/action', {
      action: 'toggle',
      device,
    });
    this.socketUpdate();
    return this.fetchDevices();
  }
  @Action
  async executeShortcut(shortcut: string) {
    await axios.post('/action', {
      action: 'shortcut',
      shortcut,
    });
    this.socketUpdate();
    return this.fetchDevices();
  }
  @Action
  async executePreset(preset: string) {
    await axios.post('/action', {
      action: 'preset',
      preset,
    });
    this.socketUpdate();
    return this.fetchDevices();
  }
  @Mutation
  setCurrentLayer(currentLayer: string) {
    this.currentLayer = currentLayer;
  }
  @MutationAction({ mutate: ['blinkenlightOptions'] })
  async fetchBlinkenlightOptions(device: string) {
    const blinkenlightOptions = (await axios.get('/ajax/blinkencontrol', {
      params: {
        device,
      },
    })).data;
    return {
      blinkenlightOptions: {
        ...this.blinkenlightOptions,
        [device]: blinkenlightOptions,
      },
    };
  }
  @Action
  async saveBlinkenlightOption({
    device,
    raw_string,
  }: {
    device: string;
    raw_string: string;
  }) {
    await axios.post('/ajax/blinkencontrol', {
      device,
      raw_string,
    });
    this.fetchDevices();
  }
}
