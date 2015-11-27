import { fetchDevices } from '../Actions/devices';
import { connect } from 'react-redux';
import Lamp from './Lamp';
import ConfiguredRadium from 'configuredRadium';
import React from 'react';


@connect(state => ({
  lamps: state.devices,
}))
@ConfiguredRadium
export default class Map extends React.Component {
  static propTypes = {
    lamps: React.PropTypes.array,
  };
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
    return (
      <div style={Map.style.wrapper}>
        {
          lamps.map((lamp, key) => <Lamp key={key} lamp={lamp}/>)
        }
      </div>
    );
  }
}
