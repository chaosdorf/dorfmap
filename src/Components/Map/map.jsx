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
    lampStore.on('tooltipUpdate', this.onTooltipUpdate);
  }
  componentWillUnmount() {
    lampStore.off('lamps', this.onLamps);
    lampStore.off('tooltipUpdate', this.onTooltipUpdate);
  }
  onLamps(lamps) {
    this.setState({
      lamps
    });
  }
  onTooltipUpdate(target) {
    if (target) {
      const e = {
        target,
        clientX: this.refs.tooltip.state.x,
        clientY: this.refs.tooltip.state.y
      };
      this.refs.tooltip.showTooltip(e);
    }
  }
  render() {
    const tooltip = Object.keys(this.state.lamps).length > 0 ? <Tooltip ref="tooltip"/> : null;
    return (
      <div className="map">
        {tooltip}
        {_.map(this.state.lamps, (lamp, key) => <Lamp key={key} lamp={lamp}/>)}
      </div>
    );
  }
}
