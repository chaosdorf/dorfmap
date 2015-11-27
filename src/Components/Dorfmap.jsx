import AboutHeader from './AboutHeader';
import Map from './Map';
import OptionDialogs from './OptionDialogs';
import Radium, { Style } from 'radium';
import React from 'react';

@Radium
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
