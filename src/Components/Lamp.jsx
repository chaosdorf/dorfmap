/* @flow */
import _ from 'lodash';
import { autobind } from 'core-decorators';
import { toggleDevice, reduceDelay } from '../Actions/devices';
import BlinkenlightPopup from './BlinkenlightPopup';
import ConfiguredRadium from 'configuredRadium';
import React from 'react';
import SegmentPopup from './SegmentPopup';
import Tooltip from 'rc-tooltip';

function getImage(lamp: Object) {
  let status = '';
  switch (lamp.status) {
    case 0:
    case '0':
    status = '_off';
    break;
    case 1:
    case '1':
    status = '_on';
    break;
    default:
    break;
  }
  let baseImage;
  switch (lamp.type) {
    case 'light':
    if (lamp.name === 'hackcenter_blau') {
      baseImage = 'hackcenter_blau';
    } else {
      baseImage = 'light';
    }
    break;
    case 'light_au':
    if (lamp.auto) {
      baseImage = 'light_auto';
    } else {
      baseImage = 'light_noauto';
    }
    break;
    default:
    baseImage = lamp.type;
    break;
  }
  return `static/images/${baseImage}${status}.png`;
}

type Props = {
  lamp: Lamp,
}

type State = {
  dialogOpen: bool,
}

/*::`*/
@ConfiguredRadium
/*::`*/
export default class LampComponent extends React.Component<void, Props, State> {
  static propTypes = {
    lamp: React.PropTypes.object.isRequired,
  };
  static style = {
    lamp: {
      writeable: {
        cursor: 'pointer',
        transition: '300ms linear',
        ':hover': {
          transform: 'scale(1.3)',
        },
      },
      normal: {
        position: 'absolute',
      },
    },
  };
  state: State = {
    dialogOpen: false,
  };
  lampCopy: Lamp = _.cloneDeep(this.props.lamp);
  getTooltipText(lamp: Lamp): ?React.Element {
    let text = lamp.status_text;
    if (!text) {
      return null;
    }
    if (lamp.rate_delay > 0) {
      text = `${text} (${lamp.rate_delay}s)`;
    }
    /* eslint-disable react/no-danger */
    return <div dangerouslySetInnerHTML={{ __html: text }}/>;
    /* eslint-enable react/no-danger */
  }
  getDuplicate(lamp: Lamp, tooltipText: ?React.Element) {
    if (!lamp.duplicates || !lamp.duplicates.length) {
      return null;
    }

    const dup = lamp.duplicates[0];
    const dupStyle = [LampComponent.style.lamp.normal, {
      left: dup.x1,
      top: dup.y1,
      width: lamp.x2,
      height: lamp.y2,
    }];
    if (lamp.is_writable && lamp.rate_delay <= 0) {
      dupStyle.push(LampComponent.style.lamp.writeable);
    }
    return (
      <Tooltip destroyTooltipOnHide
        overlay={tooltipText}>
        <img
          ref="duplicate"
          onTouchTap={this.toggle}
          name={lamp.name}
          style={dupStyle}
          src={getImage(lamp)}/>
      </Tooltip>
    );
  }
  @autobind
  toggle() {
    const { lamp } = this.props;
    if (lamp.type === 'charwrite' || lamp.type === 'blinkenlight') {
      this.setState({
        dialogOpen: true,
      });
    } else if (lamp.rate_delay <= 0) {
      toggleDevice(lamp);
    }
  }
  @autobind
  handleRequestClose() {
    this.setState({
      dialogOpen: false,
    });
  }
  componentWillReceiveProps(props: Props) {
    const { lamp } = props;
    if (lamp.status === 1) {
      /* eslint-disable camelcase */
      lamp.rate_delay = 0;
    } else if (lamp.rate_delay > 0) {
      /* eslint-enable camelcase */
      setTimeout(() => reduceDelay(lamp, false), 1000);
    }
  }
  render(): React.Element {
    const { lamp } = this.props;
    const { dialogOpen } = this.state;
    const style = [LampComponent.style.lamp.normal, {
      left: lamp.x1,
      top: lamp.y1,
      width: lamp.x2,
      height: lamp.y2,
    }];
    if (lamp.is_writable && lamp.rate_delay <= 0) {
      style.push(LampComponent.style.lamp.writeable);
    }
    let dialog;
    if (lamp.type === 'charwrite') {
      dialog = (<SegmentPopup onRequestClose={this.handleRequestClose} open={dialogOpen} lamp={lamp}/>);
    } else if (lamp.type === 'blinkenlight') {
      dialog = (<BlinkenlightPopup onRequestClose={this.handleRequestClose} open={dialogOpen} lamp={lamp}/>);
    }
    const tooltipText = this.getTooltipText(lamp);
    const img = (
      <img
        ref="normal"
        onTouchTap={this.toggle}
        name={lamp.name}
        style={style}
        src={getImage(lamp)}/>
    );
    return (
      <div>
        {
          tooltipText ? (<Tooltip destroyTooltipOnHide overlay={tooltipText}>
            {img}
          </Tooltip>) : img
        }
        {this.getDuplicate(lamp, tooltipText)}
        {dialog}
      </div>
    );
  }
}
