import AboutHeader from './AboutHeader';
import DeviceContainer from 'container/DeviceContainer';
import Map from './Map';
import OptionDialogs from './OptionDialogs';
import React from 'react';
import useStyles from './Dorfmap.style';

const Dorfmap = () => {
  useStyles();

  return (
    <DeviceContainer.Provider>
      <OptionDialogs />
      <AboutHeader />
      <Map />
    </DeviceContainer.Provider>
  );
};

export default Dorfmap;
