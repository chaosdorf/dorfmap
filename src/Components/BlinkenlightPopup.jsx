// @flow
import { connect } from 'react-redux';
import { fetchPresets, saveBlinkenlight } from '../Actions/devices';
import { Radio, RadioGroup } from 'react-radio-group';
import _ from 'lodash';
import ConfiguredRadium from '../configuredRadium';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import React from 'react';

type Props = {
  lamp: Object,
  onRequestClose: Function,
  open: boolean,
  presets?: Object,
};

type State = {
  active?: boolean,
};

@ConfiguredRadium
@connect(state => ({
  presets: state.presets,
}))
export default class BlinkenlightPopup extends React.Component {
  props: Props;
  state: State = {};
  componentWillMount() {
    fetchPresets(this.props.lamp);
  }
  componentWillReceiveProps(nextProps: Props) {
    if (
      nextProps.presets &&
      nextProps.presets[nextProps.lamp.name] &&
      nextProps.presets[nextProps.lamp.name].active
    ) {
      this.setState({
        active: nextProps.presets[nextProps.lamp.name].active.raw_string,
      });
    }
  }
  save = () => {
    saveBlinkenlight(this.props.lamp, this.state.active);
    this.props.onRequestClose();
  };
  handleRadioChange = (value: boolean) => {
    this.setState({
      active: value,
    });
  };
  render() {
    const { onRequestClose, open, presets, lamp } = this.props;
    const { active } = this.state;
    if (!presets || !presets[lamp.name]) {
      return null;
    }
    const actualPresets = presets[lamp.name].presets;
    const actions = (
      <div>
        <FlatButton key="c" onClick={onRequestClose}>{'Cancel'}</FlatButton>
        <FlatButton key="s" onClick={this.save}>{'Save'}</FlatButton>
      </div>
    );
    return (
      <Dialog actions={actions} onRequestClose={onRequestClose} open={open}>
        <div>
          <RadioGroup
            selectedValue={active}
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
