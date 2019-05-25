import { AppState } from 'AppState';
import { connect, ResolveThunks } from 'react-redux';
import { Lamp } from 'Components/Lamp';
import { Presets } from 'reducers/device';
import Actions, { fetchPresets, savePreset } from 'actions/device';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import React from 'react';

type StateProps = {
  presets?: Presets;
};

type OwnProps = {
  lamp: Lamp;
  onRequestClose: () => void;
};

type DispatchProps = ResolveThunks<{
  fetchPresets: typeof fetchPresets;
  setActivePreset: typeof Actions.setActivePreset;
  savePreset: typeof savePreset;
}>;

type Props = StateProps & OwnProps & DispatchProps;

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
  handleRadioChange = (_: React.ChangeEvent<{}>, value: string) => {
    const { lamp, setActivePreset } = this.props;

    setActivePreset({
      deviceName: lamp.name,
      value,
    });
    this.forceUpdate();
  };
  render() {
    const { onRequestClose, presets } = this.props;

    if (!presets) {
      return null;
    }
    const actualPresets = presets.presets;

    return (
      <Dialog onClose={onRequestClose} onBackdropClick={onRequestClose} open>
        <DialogContent>
          <RadioGroup
            name="blinken"
            value={presets.active ? presets.active.raw_string : '32,0,0,0'}
            onChange={this.handleRadioChange}
          >
            {actualPresets.map(preset => (
              <FormControlLabel
                value={preset.raw_string}
                label={preset.name}
                key={preset.name}
                control={<Radio />}
              />
            ))}
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={onRequestClose}>Cancel</Button>
          <Button onClick={this.save}>Save</Button>
        </DialogActions>
      </Dialog>
    );
  }
}

export default connect<StateProps, DispatchProps, OwnProps, AppState>(
  (state, ownProps) => ({
    presets: state.device.presets[ownProps.lamp.name],
  }),
  {
    fetchPresets,
    setActivePreset: Actions.setActivePreset,
    savePreset,
  }
)(BlinkenlightPopup);
