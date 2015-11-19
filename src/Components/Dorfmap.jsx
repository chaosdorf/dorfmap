import AboutHeader from './AboutHeader.jsx';
import Map from './Map.jsx';
import OptionDialogs from './OptionDialogs.jsx';
import Radium from 'radium';
import React from 'react';

@Radium
export default class Dorfmap extends React.Component {
  render() {
    return (
      <div>
        <OptionDialogs/>
        <AboutHeader/>
        <Map/>
      </div>
    );
  }
}
