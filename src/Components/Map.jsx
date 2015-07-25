import Lamp from './Lamp.jsx';
import Radium from 'radium';
import React from 'react';
import lampStore from '../Stores/lampStore.js';


@Radium
export default class Map extends React.Component {
  static style = {
    wrapper: {
      backgroundImage: 'url(/static/images/map.png)',
      width: 2202,
      height: 648,
      marginLeft: 5,
      marginRight: 5,
      position: 'relative'
    }
  }
  state = {
    lamps: {}
  }
  componentDidMount() {
    lampStore.on('lamps', this.onLamps);
  }
  componentWillUnmount() {
    lampStore.off('lamps', this.onLamps);
  }
  onLamps = (lamps) => {
    this.setState({
      lamps
    });
  }
  render() {
    return (
      <div style={Map.style.wrapper}>
        {_.map(this.state.lamps, (lamp, key) => <Lamp key={key} lamp={lamp}/>)}
      </div>
    );
  }
}
