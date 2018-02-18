// @flow
import { connect } from 'react-redux';
import { fetchPresets, savePreset, setActivePreset } from 'actions/device';
import { RadioButton, RadioGroup } from 'react-toolbox/lib/radio';
import Dialog from 'react-toolbox/lib/dialog';
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

    const dialogActions = [{ label: 'Cancel', onClick: onRequestClose }, { label: 'Save', onClick: this.save }];

    return (
      <Dialog
        type="small"
        onOverlayClick={onRequestClose}
        onEscKeyDown={onRequestClose}
        active={open}
        actions={dialogActions}
      >
        <RadioGroup
          name="blinken"
          value={presets.active ? presets.active.raw_string : null}
          onChange={this.handleRadioChange}
        >
          {actualPresets.map(preset => <RadioButton key={preset.name} value={preset.raw_string} label={preset.name} />)}
        </RadioGroup>
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
