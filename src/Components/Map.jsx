/* @flow */
import { fetchDevices } from '../Actions/devices';
import { connect } from 'react-redux';
import Lamp from './Lamp';
import ConfiguredRadium from 'configuredRadium';
import React from 'react';
import type { Map } from 'immutable';


type Props = {
  lamps?: Map<string, Lamp>,
}

/*::`*/
@connect(state => ({
  lamps: state.devices,
}))
@ConfiguredRadium
/*::`*/
export default class DMap extends React.Component {
  props: Props;
  static style = {
    wrapper: {
      backgroundImage: 'url(/static/images/map.png)',
      width: 2202,
      height: 648,
      marginLeft: 5,
      marginRight: 5,
      position: 'relative',
    },
  };
  componentWillMount() {
    fetchDevices();
  }
  render() {
    const { lamps } = this.props;
    if (!lamps) {
      return null;
    }
    return (
      <div style={DMap.style.wrapper}>
        {
          lamps.map((lamp, key) => <Lamp key={key} lamp={lamp}/>).toArray()
        }
      </div>
    );
  }
}
