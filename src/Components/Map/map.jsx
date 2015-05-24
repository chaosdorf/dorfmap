import './map.less';

import Lamp from '../Lamp/lamp.jsx';
import lampStore from '../../Stores/lampStore.js';

@autoBind
export default class extends React.Component {
  state = {
    lamps: lampStore.devices.toJS()
  }
  componentDidMount() {
    lampStore.on('lamps', this.onLamps);
  }
  componentWillUnmount() {
    lampStore.off('lamps', this.onLamps);
  }
  onLamps(lamps) {
    this.setState({
      lamps
    });
  }
  render() {
    return (
      <div className="map">
        {_.map(this.state.lamps, (lamp, key) => <Lamp key={key} lamp={lamp}/>)}
      </div>
    );
  }
}
