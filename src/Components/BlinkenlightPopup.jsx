// @flow
import { connect } from 'react-redux';
import { fetchPresets, savePreset, setActivePreset } from 'actions/device';
import { Radio, RadioGroup } from 'react-radio-group';
import Button from 'material-ui/Button';
import Dialog, { DialogActions, DialogContent } from 'material-ui/Dialog';
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

    return (
      <Dialog fullscreen onClose={onRequestClose} open={open}>
        <DialogContent>
          <RadioGroup
            selectedValue={presets.active ? presets.active.raw_string : null}
            onChange={this.handleRadioChange}
          >
            {actualPresets.map(preset => (
              <div style={{ lineHeight: '32px' }} key={preset.name}>
                <label>
                  <Radio style={{ marginRight: 5 }} value={preset.raw_string} />
                  {preset.name}
                </label>
              </div>
            ))}
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button variant="flat" key="c" onClick={onRequestClose}>
            {'Cancel'}
          </Button>
          <Button variant="flat" key="s" onClick={this.save}>
            {'Save'}
          </Button>
        </DialogActions>
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
