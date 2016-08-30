/* @flow */
import _ from 'lodash';
import { autobind } from 'core-decorators';
import { connect } from 'react-redux';
import { Button, Overlay, Panel, Divider } from 'rebass';
import { fetchPresets, saveBlinkenlight } from '../Actions/devices';
import ConfiguredRadium from '../configuredRadium';
import { RadioGroup, Radio } from 'react-radio-group';
import React from 'react';

type Props = {
  lamp: Object,
  onRequestClose: Function,
  open: bool,
  presets?: Object,
}

type State = {
  active?: bool,
}


const style = {
  buttonWrapper: {
    display: 'flex',
    justifyContent: 'space-around',
  },
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
    if (nextProps.presets && nextProps.presets[nextProps.lamp.name] && nextProps.presets[nextProps.lamp.name].active) {
      this.setState({
        active: nextProps.presets[nextProps.lamp.name].active.raw_string,
      });
    }
  }
  @autobind
  save() {
    saveBlinkenlight(this.props.lamp, this.state.active);
    this.props.onRequestClose();
  }
  @autobind
  handleRadioChange(value: bool) {
    this.setState({
      active: value,
    });
  }
  render() {
    const { onRequestClose, open, presets, lamp } = this.props;
    const { active } = this.state;
    if (!presets || !presets[lamp.name]) {
      return null;
    }
    const actualPresets = presets[lamp.name].presets;
    return (
      <Overlay
        onDismiss={onRequestClose}
        open={open}>
        <Panel>
          <RadioGroup selectedValue={active} ref="radio" onChange={this.handleRadioChange}>
            {
              _.map(actualPresets, (preset) => (
                <div style={{ lineHeight: '32px' }} key={preset.name}>
                  <label>
                    <Radio style={{ marginRight: 5 }} value={preset.raw_string}/>
                    {preset.name}
                  </label>
                </div>
              ))
            }
          </RadioGroup>
          <Divider/>
          <div style={style.buttonWrapper}>
            <Button onClick={onRequestClose}>Cancel</Button>
            <Button onClick={this.save}>Save</Button>
          </div>
        </Panel>
      </Overlay>
    );
  }
}
