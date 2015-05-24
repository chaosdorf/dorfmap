import './lamp.less';
import lampStore from '../../Stores/lampStore.js';

import { Tooltip } from 'material-ui';

@autoBind
export default class extends React.Component {
  state = {
    tooltip: false,
    tooltipDup: false
  }
  getDuplicate(lamp, image, className) {
    if (!lamp.duplicates) {
      return null;
    }

    const dup = lamp.duplicates[0];
    const dupStyle = {
      left: dup.x1 + 'px',
      top: dup.y1 + 'px',
      width: lamp.x2 + 'px',
      height: lamp.y2 + 'px'
    };
    return (
      <div name={lamp.name}
        className={className}
        style={dupStyle}
        onMouseEnter={this.mouseEnterDup}
        onMouseLeave={this.mouseLeaveDup}>
        <img src={image}/>
        <Tooltip show={this.state.tooltipDup} label={lamp.status_text}/>
      </div>
    );
  }
  mouseEnterDup() {
    this.setState({
      tooltipDup: true
    });
  }
  mouseLeaveDup() {
    this.setState({
      tooltipDup: false
    });
  }
  mouseEnter() {
    this.setState({
      tooltip: true
    });
  }
  mouseLeave() {
    this.setState({
      tooltip: false
    });
  }
  render() {
    const lamp = this.props.lamp;
    const style = {
      left: lamp.x1 + 'px',
      top: lamp.y1 + 'px',
      width: lamp.x2 + 'px',
      height: lamp.y2 + 'px'
    };
    if (lamp.type === 'infoarea') {
      return (
        <div className="infoarea"
          style={style}
          dangerouslySetInnerHTML={{
            __html: lamp.status_text
          }
        }/>
      );
    }
    const className = classNames({
      lamp: true,
      writeable: lamp.is_writable && lamp.rate_delay <= 0
    });
    const image = lampStore.getImage(lamp);
    return (
      <div>
        <div name={lamp.name}
          className={className}
          style={style}
          onMouseEnter={this.mouseEnter}
          onMouseLeave={this.mouseLeave}>
          <img src={image}/>
          <Tooltip show={this.state.tooltip} label={lamp.status_text}/>
        </div>
        {this.getDuplicate(lamp, image, className)}
      </div>
    );
  }
}
