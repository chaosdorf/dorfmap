// @flow
import { inject, observer } from 'mobx-react';
import { Radio, RadioGroup } from 'react-radio-group';
import _ from 'lodash';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import React from 'react';
import type DeviceStore from 'Store/DeviceStore';

type Props = {
  lamp: Object,
  onRequestClose: Function,
  open: boolean,
  deviceStore?: DeviceStore,
};

@inject('deviceStore')
@observer
export default class BlinkenlightPopup extends React.PureComponent<Props> {
  componentWillMount() {
    const { deviceStore } = this.props;
    if (deviceStore) {
      deviceStore.fetchPresets(this.props.lamp);
    }
  }
  save = () => {
    const { deviceStore, lamp } = this.props;
    if (deviceStore) {
      deviceStore.savePreset(lamp.name);
    }
    this.props.onRequestClose();
  };
  handleRadioChange = (value: string) => {
    const { lamp, deviceStore } = this.props;
    if (deviceStore) {
      deviceStore.setActivePreset(lamp.name, value);
      this.forceUpdate();
    }
  };
  render() {
    const { onRequestClose, open, lamp, deviceStore } = this.props;
    if (!deviceStore || !deviceStore.presets.has(lamp.name)) {
      return null;
    }
    const presets = deviceStore.presets.get(lamp.name);
    const actualPresets = presets.presets;
    const actions = (
      <div>
        <FlatButton key="c" onClick={onRequestClose}>
          {'Cancel'}
        </FlatButton>
        <FlatButton key="s" onClick={this.save}>
          {'Save'}
        </FlatButton>
      </div>
    );
    return (
      <Dialog actions={actions} onRequestClose={onRequestClose} open={open}>
        <div>
          <RadioGroup
            selectedValue={presets.active ? presets.active.raw_string : null}
            ref="radio"
            onChange={this.handleRadioChange}>
            {_.map(actualPresets, preset => (
              <div style={{ lineHeight: '32px' }} key={preset.name}>
                <label>
                  <Radio style={{ marginRight: 5 }} value={preset.raw_string} />
                  {preset.name}
                </label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </Dialog>
    );
  }
}
