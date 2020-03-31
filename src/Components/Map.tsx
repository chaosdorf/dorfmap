import DeviceContainer from 'container/DeviceContainer';
import LampComponent from './Lamp';
import React, { useEffect, useMemo } from 'react';
import useStyles from './Map.style';

const DMap = () => {
  const { fetchDevices, devices, layer } = DeviceContainer.useContainer();
  const filteredDevices = useMemo(
    () => Object.values(devices).filter((d) => d.layer === layer),
    [devices, layer]
  );

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);
  const classes = useStyles();

  return (
    <div className={classes.main}>
      {filteredDevices.map((lamp) => (
        <LampComponent key={lamp.name} lamp={lamp} />
      ))}
    </div>
  );
};

export default DMap;
