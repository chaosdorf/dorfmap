// @flow
import { connect } from 'react-redux';
import { fetchPresets, savePreset, setActivePreset } from 'actions/device';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
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
  componentDidMount() {
    const { fetchPresetsProp, lamp } = this.props;

    fetchPresetsProp(lamp);
  }
  save = () => {
    const { lamp, savePresetProp, presets } = this.props;

    if (presets && presets.active) {
      savePresetProp(lamp.name, presets.active.raw_string);
    }
    this.props.onRequestClose();
  };
  handleRadioChange = event => {
    const { lamp, setActivePresetProp } = this.props;

    setActivePresetProp(lamp.name, event.target.value);
    this.forceUpdate();
  };
  render() {
    const { onRequestClose, open, presets } = this.props;

    if (!presets) {
      return null;
    }
    const actualPresets = presets.presets;

    return (
      <Dialog onClose={onRequestClose} onBackdropClick={onRequestClose} open={open}>
        <DialogContent>
          <RadioGroup
            name="blinken"
            value={presets.active ? presets.active.raw_string : '32,0,0,0'}
            onChange={this.handleRadioChange}
          >
            {actualPresets.map(preset => (
              <FormControlLabel value={preset.raw_string} label={preset.name} key={preset.name} control={<Radio />} />
            ))}
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button label="Cancel" onClick={onRequestClose}>
            Cancel
          </Button>
          <Button onClick={this.save}>Save</Button>
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
