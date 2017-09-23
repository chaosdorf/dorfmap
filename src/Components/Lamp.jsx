// @flow
import * as React from 'react';
import { inject } from 'mobx-react';
import BlinkenlightPopup from './BlinkenlightPopup';
import Tooltip from 'rc-tooltip';
import type DeviceStore from 'Store/DeviceStore';

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
      baseImage = 'light';
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
  deviceStore?: DeviceStore,
};

type State = {
  dialogOpen: boolean,
};

@inject('deviceStore')
export default class LampComponent extends React.Component<Props, State> {
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
  getTooltipText(lamp: Lamp): ?React.Node {
    let text = lamp.status_text;
    if (!text) {
      return null;
    }
    if (lamp.rate_delay > 0) {
      text = `${text} (${lamp.rate_delay}s)`;
    }
    /* eslint-disable react/no-danger */
    return <div dangerouslySetInnerHTML={{ __html: text }} />;
    /* eslint-enable react/no-danger */
  }
  getDuplicate(lamp: Lamp, tooltipText: ?React.Node) {
    if (!lamp.duplicates || !lamp.duplicates.length) {
      return null;
    }

    const dup = lamp.duplicates[0];
    const dupStyle = [
      LampComponent.style.lamp.normal,
      {
        left: dup.x1,
        top: dup.y1,
        width: lamp.x2,
        height: lamp.y2,
      },
    ];
    if (lamp.is_writable && lamp.rate_delay <= 0) {
      dupStyle.push(LampComponent.style.lamp.writeable);
    }
    return (
      <Tooltip destroyTooltipOnHide overlay={tooltipText}>
        <img ref="duplicate" onClick={this.toggle} name={lamp.name} style={dupStyle} src={getImage(lamp)} />
      </Tooltip>
    );
  }
  toggle = () => {
    const { lamp, deviceStore } = this.props;
    if (lamp.type === 'charwrite' || lamp.type === 'blinkenlight') {
      // if (lamp.type === 'charwrite' || lamp.type === 'blinkenlight' || lamp.type === 'beamer') {
      this.setState({
        dialogOpen: true,
      });
    } else if (lamp.rate_delay <= 0 && deviceStore) {
      deviceStore.toggleDevice(lamp);
    }
  };
  handleRequestClose = () => {
    this.setState({
      dialogOpen: false,
    });
  };
  doesReduce: boolean = false;
  componentWillReceiveProps(props: Props) {
    const { lamp } = props;
    if (lamp.status === 1) {
      /* eslint-disable camelcase */
      lamp.rate_delay = 0;
      this.doesReduce = false;
    } else if (lamp.rate_delay > 0 && !this.doesReduce) {
      this.reduceDelay(lamp);
    }
  }
  reduceDelay(lamp: Lamp) {
    this.doesReduce = true;
    setTimeout(() => {
      lamp.rate_delay -= 1;
      this.forceUpdate();
      if (lamp.rate_delay > 0) {
        this.reduceDelay(lamp);
      }
    }, 1000);
  }
  render() {
    const { lamp } = this.props;
    const { dialogOpen } = this.state;
    const style = [
      LampComponent.style.lamp.normal,
      {
        left: lamp.x1,
        top: lamp.y1,
        width: lamp.x2,
        height: lamp.y2,
      },
    ];
    if (lamp.is_writable && lamp.rate_delay <= 0) {
      style.push(LampComponent.style.lamp.writeable);
    }
    let dialog;
    if (lamp.type === 'blinkenlight') {
      dialog = <BlinkenlightPopup onRequestClose={this.handleRequestClose} open={dialogOpen} lamp={lamp} />;
      // Toggle me to enable beamer Popup!
      // } else if (lamp.type === 'beamer') {
      // dialog = (<BeamerPopup onRequestClose={this.handleRequestClose} open={dialogOpen} lamp={lamp}/>);
    }
    const tooltipText = this.getTooltipText(lamp);
    const img = <img ref="normal" onClick={this.toggle} name={lamp.name} style={style} src={getImage(lamp)} />;
    return (
      <div>
        {tooltipText ? <Tooltip overlay={tooltipText}>{img}</Tooltip> : img}
        {this.getDuplicate(lamp, tooltipText)}
        {dialog}
      </div>
    );
  }
}
