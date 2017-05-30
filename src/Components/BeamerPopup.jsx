// @flow
import { connect } from 'react-redux';
import { fetchBeamer, saveBeamer } from '../Actions/devices';
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
  modes?: Object,
};

type State = {
  active?: boolean,
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
  save = () => {
    saveBeamer(this.props.lamp, this.state.active);
    this.props.onRequestClose();
  };
  handleRadioChange = (value: boolean) => {
    this.setState({
      active: value,
    });
  };
  render() {
    const { onRequestClose, open, modes, lamp } = this.props;
    const { active } = this.state;
    if (!modes || !modes[lamp.name]) {
      return null;
    }
    const actualModes = modes[lamp.name];
    const actions = (
      <div>
        <FlatButton key="a" onClick={onRequestClose}>{'Cancel'}</FlatButton>
        <FlatButton key="b" onClick={this.save}>{'Save'}</FlatButton>
      </div>
    );
    return (
      <Dialog actions={actions} onDismiss={onRequestClose} open={open}>
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
      </Dialog>
    );
  }
}
