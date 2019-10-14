import { Lamp } from 'Components/Lamp';
import { useDispatch } from 'react-redux';
import Actions, { fetchPresets, savePreset } from 'actions/device';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import React, { useCallback, useEffect } from 'react';
import useReduxState from 'hooks/useReduxState';

type Props = {
  lamp: Lamp;
  onRequestClose: () => void;
};

const BlinkenlightPopup = ({ lamp, onRequestClose }: Props) => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchPresets(lamp));
  }, [dispatch, lamp]);

  const allPresets = useReduxState(state => state.device.presets);
  const presets = allPresets[lamp.name];

  const save = useCallback(() => {
    if (presets && presets.active) {
      dispatch(savePreset(lamp.name, presets.active.raw_string));
    }
    onRequestClose();
  }, [dispatch, lamp.name, onRequestClose, presets]);

  const handleRadioChange = useCallback(
    (_: React.ChangeEvent<{}>, value: string) => {
      dispatch(
        Actions.setActivePreset({
          deviceName: lamp.name,
          value,
        })
      );
    },
    [dispatch, lamp.name]
  );

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
          onChange={handleRadioChange}
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
        <Button onClick={save}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default BlinkenlightPopup;
