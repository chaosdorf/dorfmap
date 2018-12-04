// @flow
import { Actions, fetchPresets, savePreset } from 'actions/device';
import { connect } from 'react-redux';
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

type StateProps = {|
  presets: ?Presets,
|};

type OwnProps = {|
  lamp: Lamp,
  onRequestClose: Function,
  open: boolean,
|};

type DispatchProps = {|
  fetchPresets: typeof fetchPresets,
  setActivePreset: typeof Actions.setActivePreset,
  savePreset: typeof savePreset,
|};

type Props = {|
  ...StateProps,
  ...OwnProps,
  ...DispatchProps,
|};

class BlinkenlightPopup extends React.Component<Props> {
  componentDidMount() {
    const { fetchPresets, lamp } = this.props;

    fetchPresets(lamp);
  }
  save = () => {
    const { lamp, savePreset, presets } = this.props;

    if (presets && presets.active) {
      savePreset(lamp.name, presets.active.raw_string);
    }
    this.props.onRequestClose();
  };
  handleRadioChange = event => {
    const { lamp, setActivePreset } = this.props;

    setActivePreset({
      deviceName: lamp.name,
      value: event.target.value,
    });
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

export default connect<AppState, Function, OwnProps, StateProps, DispatchProps>(
  (state, ownProps) => ({
    presets: state.device.presets[ownProps.lamp.name],
  }),
  {
    fetchPresets,
    setActivePreset: Actions.setActivePreset,
    savePreset,
  }
)(BlinkenlightPopup);
