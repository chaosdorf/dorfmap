import AboutHeader from './AboutHeader';
import Map from './Map';
import OptionDialogs from './OptionDialogs';
import { Style } from 'radium';
import ConfiguredRadium from 'configuredRadium';
import React from 'react';

@ConfiguredRadium
export default class Dorfmap extends React.Component {
  static style = {
    'html': {
      fontFamily: 'Roboto, sans-serif',
    },
    '.rc-tooltip-inner': {
      minHeight: 'initial',
    },
  };
  render() {
    return (
      <div>
        <Style rules={Dorfmap.style}/>
        <OptionDialogs/>
        <AboutHeader/>
        <Map/>
      </div>
    );
  }
}
