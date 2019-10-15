import { createContainer } from 'unstated-next';
import { Lamp } from 'Components/Lamp';
import { useCallback, useEffect, useState } from 'react';
import Axios from 'axios';

// @ts-ignore
// eslint-disable-next-line no-undef
const socketUrl = SOCKET_URL || 'http://localhost:3001';

const useSocket = (fetchDevices: Function) => {
  useEffect(() => {
    // @ts-ignore
    if (global.EventSource) {
      try {
        const stream = new EventSource(`${socketUrl}/events`);

        stream.onmessage = (e: any) => {
          if (e.data !== 'PING') {
            // We update all because we have hackcenter_weiß and hackcenter_blau - same lamp, different setting
            fetchDevices();
          }
        };

        return () => {
          stream.close();
        };
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Real time updates not working');
      }
    } else {
      // eslint-disable-next-line no-console
      console.warn('Real time updates not working');
    }
  }, [fetchDevices]);
};

type Devices = Record<string, Lamp>;
const useDevices = () => {
  const [layer, setLayer] = useState('control');
  const [devices, setDevices] = useState<Devices>({});
  const fetchDevices = useCallback(async () => {
    const devices: Devices = (await Axios.get('/status/devices.json')).data;

    for (const device of Object.values(devices)) {
      if (device.status === 1) {
        device.rate_delay = 0;
      }
    }

    setDevices(devices);
  }, []);

  useSocket(fetchDevices);

  return {
    layer,
    setLayer,
    fetchDevices,
    devices,
  };
};

export const useExecuteAction = () => {
  const device = DeviceContainer.useContainer();

  return useCallback(
    async (action: 'shortcut' | 'toggle' | 'preset', value: string) => {
      const postParams: any = {
        action,
      };

      if (action === 'toggle') {
        postParams.device = value;
      } else {
        postParams[action] = value;
      }
      await Axios.post('/action', postParams);
      fetch(`${socketUrl}/fire`);
      await device.fetchDevices();
    },
    [device]
  );
};

const DeviceContainer = createContainer(useDevices);

export default DeviceContainer;
