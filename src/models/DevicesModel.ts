import { Vue, Component } from 'vue-property-decorator';
import axios from 'axios';

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

@Component
export default class DevicesModel extends Vue {
  devices: Lamp[] = [];
  currentLayer = 'control';
  blinkenlightOptions: { [key: string]: BlinkenlightOptions } = {};

  private socketUpdate() {
    try {
      // @ts-ignore
      // eslint-disable-next-line no-undef
      window.fetch(`${SOCKET_URL}/fire?id=__ALL__`);
    } catch (e) {
      // ignore
    }
  }

  get filteredDevices() {
    return this.devices.filter(d => d.layer === this.currentLayer);
  }

  created() {
    this.fetchDevices();
  }

  async fetchDevices() {
    this.devices = Object.values(
      (await axios.get('/status/devices.json')).data
    );
  }

  async toggleDevice(device: string) {
    await axios.post('/action', {
      action: 'toggle',
      device,
    });
    this.socketUpdate();
    await this.fetchDevices();
  }

  async executeShortcut(shortcut: string) {
    await axios.post('/action', {
      action: 'shortcut',
      shortcut,
    });
    this.socketUpdate();
    return this.fetchDevices();
  }

  async executePreset(preset: string) {
    await axios.post('/action', {
      action: 'preset',
      preset,
    });
    this.socketUpdate();
    return this.fetchDevices();
  }

  setCurrentLayer(currentLayer: string) {
    this.currentLayer = currentLayer;
  }

  async fetchBlinkenlightOptions(device: string) {
    const blinkenlightOptions = (await axios.get('/ajax/blinkencontrol', {
      params: {
        device,
      },
    })).data;

    this.blinkenlightOptions = {
      ...this.blinkenlightOptions,
      [device]: blinkenlightOptions,
    };
  }

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
