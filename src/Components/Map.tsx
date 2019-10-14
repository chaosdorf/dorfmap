import { fetchDevices } from 'actions/device';
import { useDispatch } from 'react-redux';
import LampComponent from './Lamp';
import React, { useEffect } from 'react';
import useFilteredDevices from 'hooks/useFilteredDevices';
import useStyles from './Map.style';

const DMap = () => {
  const dispatch = useDispatch();
  const devices = useFilteredDevices();

  useEffect(() => {
    dispatch(fetchDevices());
  }, [dispatch]);
  const classes = useStyles();

  return (
    <div className={classes.main}>
      {devices.map(lamp => (
        <LampComponent key={lamp.name} lamp={lamp} />
      ))}
    </div>
  );
};

export default DMap;
