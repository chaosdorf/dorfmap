import './map.less';


import Lamp from '../Lamp/lamp.jsx';
import lampStore from '../../Stores/lampStore.js';

import Tooltip from 'react-tooltip';

@autoBind
export default class extends React.Component {
  state = {
    lamps: {}
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
    const tooltip = Object.keys(this.state.lamps).length > 0 ? <Tooltip ref="tooltip" effect="solid"/> : null;
    return (
      <div className="map">
        {tooltip}
        {_.map(this.state.lamps, (lamp, key) => <Lamp key={key} lamp={lamp}/>)}
      </div>
    );
  }
}
