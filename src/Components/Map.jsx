// @flow
import { inject, observer } from 'mobx-react';
import LampComponent from './Lamp';
import React from 'react';
import type DeviceStore from 'Store/DeviceStore';

type Props = {
  deviceStore?: DeviceStore,
};

@inject('deviceStore')
@observer
export default class DMap extends React.Component<Props> {
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
  render() {
    const { deviceStore } = this.props;

    if (!deviceStore) {
      return null;
    }

    return (
      <div style={DMap.style.wrapper}>
        {deviceStore.devices.map((lamp, key) => <LampComponent key={key} lamp={lamp} />).toList()}
      </div>
    );
  }
}
