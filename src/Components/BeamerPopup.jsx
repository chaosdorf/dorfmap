// @flow
import { autobind } from 'core-decorators';
import { Button, Divider, Overlay, Panel } from 'rebass';
import { connect } from 'react-redux';
import { fetchBeamer, saveBeamer } from '../Actions/devices';
import { Radio, RadioGroup } from 'react-radio-group';
import _ from 'lodash';
import ConfiguredRadium from '../configuredRadium';
import React from 'react';

type Props = {
  lamp: Object,
  onRequestClose: Function,
  open: boolean,
  modes?: Object
};

type State = {
  active?: boolean
};

const style = {
  buttonWrapper: {
    display: 'flex',
    justifyContent: 'space-around',
  },
};

@ConfiguredRadium
@connect(state => ({
  modes: state.beamerModes,
}))
export default class BeamerPopup extends React.Component {
  props: Props;
  state: State = {};
  componentWillMount() {
    fetchBeamer(this.props.lamp);
  }
  componentWillReceiveProps(nextProps: Props) {
    if (
      nextProps.modes &&
      nextProps.modes[nextProps.lamp.name] &&
      nextProps.modes[nextProps.lamp.name].active
    ) {
      this.setState({
        active: nextProps.modes[nextProps.lamp.name].active.name,
      });
    }
  }
  @autobind save() {
    saveBeamer(this.props.lamp, this.state.active);
    this.props.onRequestClose();
  }
  @autobind handleRadioChange(value: boolean) {
    this.setState({
      active: value,
    });
  }
  render() {
    const { onRequestClose, open, modes, lamp } = this.props;
    const { active } = this.state;
    if (!modes || !modes[lamp.name]) {
      return null;
    }
    const actualModes = modes[lamp.name];
    return (
      <Overlay onDismiss={onRequestClose} open={open}>
        <Panel>
          <RadioGroup
            selectedValue={active}
            ref="radio"
            onChange={this.handleRadioChange}>
            {_.map(actualModes, mode => (
              <div style={{ lineHeight: '32px' }} key={mode.description}>
                <label>
                  <Radio style={{ marginRight: 5 }} value={mode.name} />
                  {mode.description}
                </label>
              </div>
            ))}
          </RadioGroup>
          <Divider />
          <div style={style.buttonWrapper}>
            <Button onClick={onRequestClose}>{'Cancel'}</Button>
            <Button onClick={this.save}>{'Save'}</Button>
          </div>
        </Panel>
      </Overlay>
    );
  }
}
