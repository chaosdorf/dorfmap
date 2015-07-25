import BlinkenlightPopup from './BlinkenlightPopup.jsx';
import Radium from 'radium';
import React from 'react';
import SegmentPopup from './SegmentPopup.jsx';
import Tooltip from 'rc-tooltip';
import lampStore from '../Stores/lampStore.js';


@Radium
export default class Lamp extends React.Component {
  static style = {
    lamp: {
      writeable: {
        cursor: 'pointer',
        transition: '300ms linear'
      },
      normal: {
        position: 'absolute',
        ':hover': {
          transform: 'scale(1.2)'
        }
      }
    }
  }
  state = {
    delay: this.props.lamp.rate_delay,
    lamp: this.props.lamp
  }
  lampCopy = _.cloneDeep(this.props.lamp)
  shouldComponentUpdate(nextProps, nextState) {
    const lampUpdate = !_.isEqual(nextProps.lamp, this.lampCopy);
    if (lampUpdate) {
      this.lampCopy = _.cloneDeep(nextProps.lamp);
    }
    return lampUpdate || nextState._radiumStyleState !== this.state._radiumStyleState || nextState.delay !== this.state.delay;
  }
  componentWillReceiveProps(newProps) {
    if (newProps.lamp) {
      this.setState({
        lamp: newProps.lamp
      });
    }
  }
  componentDidMount() {
    lampStore.on('deviceUpdate', this.deviceUpdate);
    this.checkDelay();
  }
  componentWillUnmount() {
    lampStore.off('deviceUpdate', this.deviceUpdate);
    this.unmounted = true;
  }
  deviceUpdate = (lamp) => {
    if (lamp.name === this.state.lamp.name) {
      this.lampCopy = _.cloneDeep(lamp);
      this.setState({
        lamp,
        delay: lamp.rate_delay
      });
      this.checkDelay();
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
  checkDelay = () => {
    if (this.state.delay > 0) {
      if (!this.unmounted) {
        this.setState({
          delay: this.state.delay - 1
        });
        setTimeout(this.checkDelay, 1000);
      }
    }
  }
  getDuplicate(lamp, image, tooltipText) {
    if (!lamp.duplicates) {
      return null;
    }

    const dup = lamp.duplicates[0];
    const dupStyle = [Lamp.style.lamp.normal, {
      left: dup.x1 + 'px',
      top: dup.y1 + 'px',
      width: lamp.x2 + 'px',
      height: lamp.y2 + 'px'
    }];
    if (lamp.is_writable && this.state.delay <= 0) {
      dupStyle.push(Lamp.style.lamp.writeable);
    }
    return (
      <Tooltip
        overlay={tooltipText}>
        <img
          ref="duplicate"
          onMouseEnter={this.onMouseEnter.bind(this, true)}
          onMouseLeave={this.onMouseLeave}
          onTouchTap={this.toggle}
          name={lamp.name}
          style={dupStyle}
          src={image}/>
      </Tooltip>
    );
  }
  toggle = () => {
    if (this.state.lamp.type === 'charwrite') {
      this.refs.dialog.show();
    } else if (this.state.lamp.type === 'blinkenlight') {
      this.refs.dialog.show();
    } else if (this.state.delay <= 0) {
      lampStore.toggleLamp(this.state.lamp);
    }
  }
  onMouseEnter = (dup) => {
    this.target = React.findDOMNode(React.findDOMNode(dup ? this.refs.duplicate : this.refs.normal));
  }
  onMouseLeave = () => {
    this.target = null;
  }
  render() {
    const lamp = this.state.lamp;
    const style = [Lamp.style.lamp.normal, {
      left: lamp.x1 + 'px',
      top: lamp.y1 + 'px',
      width: lamp.x2 + 'px',
      height: lamp.y2 + 'px'
    }];
    if (lamp.is_writable && this.state.delay <= 0) {
      style.push(Lamp.style.lamp.writeable);
    }
    const image = lampStore.getImage(lamp);
    let dialog;
    if (lamp.type === 'charwrite') {
      dialog = (<SegmentPopup ref="dialog" lamp={lamp}/>);
    } else if (lamp.type === 'blinkenlight') {
      dialog = (<BlinkenlightPopup ref="dialog" lamp={lamp}/>);
    }
    const tooltipText = this.getTooltipText(lamp);
    const img = (<img
      ref="normal"
      onTouchTap={this.toggle}
      onMouseEnter={this.onMouseEnter.bind(this, false)}
      onMouseLeave={this.onMouseLeave}
      name={lamp.name}
      style={style}
      src={image}/>);
      return (
        <div>
          {tooltipText ? <Tooltip overlay={tooltipText}>
          {img}
        </Tooltip> : img}
        {this.getDuplicate(lamp, image, tooltipText)}
        {dialog}
      </div>
    );
  }
}
