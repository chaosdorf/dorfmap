// @flow
import { connect } from 'react-redux';
import { fetchPresets, savePreset, setActivePreset } from 'actions/device';
import { Radio, RadioGroup } from 'react-radio-group';
import _ from 'lodash';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import React from 'react';
import type { AppState } from 'AppState';
import type { Lamp } from 'Components/Lamp';
import type { Presets } from 'reducers/device';

type ReduxProps = {
  presets: ?Presets,
};

type OwnProps = {
  lamp: Lamp,
  onRequestClose: Function,
  open: boolean,
};

type Props = ReduxProps &
  OwnProps & {
    fetchPresetsProp: typeof fetchPresets,
    setActivePresetProp: typeof setActivePreset,
    savePresetProp: typeof savePreset,
  };

class BlinkenlightPopup extends React.Component<Props> {
  componentWillMount() {
    const { fetchPresetsProp, lamp } = this.props;

    fetchPresetsProp(lamp);
  }
  save = () => {
    const { lamp, savePresetProp, presets } = this.props;

    if (presets && presets.active) {
      savePresetProp(lamp.name, presets.active.raw_string);
      this.props.onRequestClose();
    }
  };
  handleRadioChange = (value: string) => {
    const { lamp, setActivePresetProp } = this.props;

    setActivePresetProp(lamp.name, value);
    this.forceUpdate();
  };
  render() {
    const { onRequestClose, open, presets } = this.props;

    if (!presets) {
      return null;
    }
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
            onChange={this.handleRadioChange}
          >
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

export default connect(
  (state: AppState, ownProps: OwnProps): ReduxProps => ({
    presets: state.device.presets.get(ownProps.lamp.name),
  }),
  {
    fetchPresetsProp: fetchPresets,
    setActivePresetProp: setActivePreset,
    savePresetProp: savePreset,
  }
)(BlinkenlightPopup);
