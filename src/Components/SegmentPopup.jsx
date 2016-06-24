/* @flow */
import _ from 'lodash';
import { autobind } from 'core-decorators';
import { connect } from 'react-redux';
import { Dialog, FlatButton, TextField } from 'material-ui';
import { fetchSegmentModes, changeSegment } from '../Actions/devices';
import ConfiguredRadium from 'configuredRadium';
import RadioGroup from 'react-radio-group';
import React from 'react';

type Props = {
  lamp: Object,
  modes?: Object,
  onRequestClose?: Function,
  open?: bool,
}

type State = {
  value?: string,
  customTxt?: string,
}

/*::`*/
@connect(state => ({
  modes: state.segmentModes,
}))
@ConfiguredRadium
/*::`*/
export default class SegmentPopup extends React.Component {
  props: Props;
  state: State = {
  };
  componentWillReceiveProps(nextProps: Props) {
    const lamp = this.props.lamp;
    let value = lamp.charwrite_text;
    let customTxt = '';
    if (nextProps.modes && !nextProps.modes.hasOwnProperty(lamp.charwrite_text)) {
      value = 'custom';
      customTxt = lamp.charwrite_text;
    }
    this.setState({
      value,
      customTxt,
    });
  }
  componentWillMount() {
    fetchSegmentModes();
  }
  @autobind
  async save(): Promise {
    let mode = this.state.value;
    if (mode === 'custom') {
      mode = this.state.customTxt;
    }
    changeSegment(this.props.lamp, mode);
    if (this.props.onRequestClose) {
      this.props.onRequestClose();
    }
  }
  @autobind
  setCustom() {
    this.setState({
      value: 'custom',
    });
  }
  @autobind
  handleChange(e: SyntheticEvent) {
    this.setState({
      // $FlowFixMe
      customTxt: e.target.value,
    });
  }
  @autobind
  handleRadioChange(value: any) {
    this.setState({
      value,
    });
  }
  render() {
    const { open, modes, onRequestClose } = this.props;
    const { value, customTxt } = this.state;
    return (
      <Dialog
        onRequestClose={onRequestClose}
        open={open}
        contentStyle={{ display: 'table', width: 'auto' }}>
        <div>
          <RadioGroup selectedValue={value} ref="radio" onChange={this.handleRadioChange}>
            {Radio => (
              <div>
                {
                  // $FlowFixMe
                  _.map(modes, (name, id) => (
                  <div style={{ lineHeight: '32px' }} key={id}>
                    <label>
                      <Radio style={{ marginRight: 5 }} value={id}/>
                      {name}
                    </label>
                  </div>
                ))}
                <div>
                  <Radio style={{ marginRight: 5 }} value="custom"/>
                  <TextField
                    value={customTxt}
                    onChange={this.handleChange}
                    onFocus={this.setCustom}
                    hintText="Custom"/>
                </div>
              </div>
            )}
          </RadioGroup>
          <div>
            <FlatButton label="Abbrechen" onClick={onRequestClose}/>
            <FlatButton label="Speichern" onClick={this.save}/>
          </div>
        </div>
      </Dialog>
    );
  }
}
