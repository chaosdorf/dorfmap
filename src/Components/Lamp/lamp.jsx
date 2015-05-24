import './lamp.less';
import lampStore from '../../Stores/lampStore.js';


@autoBind
export default class extends React.Component {
  state = {
    tooltip: false,
    tooltipDup: false,
    delay: 0,
    lamp: this.props.lamp
  }
  componentDidMount() {
    lampStore.on('deviceUpdate', this.deviceUpdate);
  }
  componentWillUnmount() {
    lampStore.off('deviceUpdate', this.deviceUpdate);
  }
  deviceUpdate(lamp) {
    if (lamp.name === this.state.lamp.name) {
      this.setState({
        lamp
      });
    }
  }
  getTooltipText(lamp) {
    let text = lamp.status_text;
    if (!text) {
      return null;
    }
    if (this.state.delay > 0) {
      return `${text} (${this.state.delay}s)`;
    }
    return lamp.status_text;
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
      <img
        onClick={this.toggle}
        data-tip={lamp.status_text}
        name={lamp.name}
        className={className}
        style={dupStyle}
        src={image}/>
    );
  }
  toggle() {
    lampStore.toggleLamp(this.state.lamp);
  }
  render() {
    const lamp = this.state.lamp;
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
    const tooltipText = {
      'data-tip': this.getTooltipText(lamp)
    };
    return (
      <div>
        <img
          onClick={this.toggle}
          {...tooltipText}
          name={lamp.name}
          className={className}
          style={style}
          src={image}/>
        {this.getDuplicate(lamp, image, className)}
      </div>
    );
  }
}
