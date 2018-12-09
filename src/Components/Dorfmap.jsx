// @flow
import { hot } from 'react-hot-loader';
import AboutHeader from './AboutHeader';
import Map from './Map';
import OptionDialogs from './OptionDialogs';
import React from 'react';

const Dorfmap = () => (
  <>
    <OptionDialogs />
    <AboutHeader />
    <Map />
  </>
);

export default hot(module)(Dorfmap);
