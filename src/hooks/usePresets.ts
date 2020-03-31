import { useCallback, useEffect, useState } from 'react';
import Axios from 'axios';

interface Color {
  name: string;
  raw_string: string;
}
export interface Presets {
  active?: Color;
  colors: Color[];
  presets: Color[];
}

function savePreset(device: string, raw_string: string) {
  Axios.post('/ajax/blinkencontrol', {
    device,
    raw_string,
  });
}

const usePresets = (deviceName: string) => {
  const [presets, setPresets] = useState<Presets>();

  useEffect(() => {
    Axios.get(`/ajax/blinkencontrol?device=${deviceName}`).then((r) => {
      setPresets(r.data);
    });
  }, [deviceName]);

  const setActivePreset = useCallback((newPreset: string) => {
    setPresets((oldPresets) =>
      oldPresets
        ? {
            ...oldPresets,
            active: oldPresets.presets.find((c) => c.raw_string === newPreset),
          }
        : oldPresets
    );
  }, []);

  return {
    presets,
    savePreset,
    setActivePreset,
  };
};

export default usePresets;
