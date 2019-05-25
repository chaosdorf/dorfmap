import AboutHeader from './AboutHeader';
import Map from './Map';
import OptionDialogs from './OptionDialogs';
import React from 'react';
import useStyles from './Dorfmap.style';

const Dorfmap = () => {
  useStyles();

  return (
    <>
      <OptionDialogs />
      <AboutHeader />
      <Map />
    </>
  );
};

export default Dorfmap;
