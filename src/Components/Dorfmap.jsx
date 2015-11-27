import AboutHeader from './AboutHeader.jsx';
import Map from './Map.jsx';
import OptionDialogs from './OptionDialogs.jsx';
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
