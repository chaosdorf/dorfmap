import _ from 'lodash';
import { connect } from 'react-redux';
import { Dialog, FlatButton, TextField } from 'material-ui';
import { fetchSegmentModes, changeSegment } from '../Actions/devices';
import RadioGroup from 'react-radio-group';
import React from 'react';

@connect(state => ({
  modes: state.segmentModes,
}))
export default class SegmentPopup extends React.Component {
  static propTypes = {
    lamp: React.PropTypes.object,
    modes: React.PropTypes.object,
    onRequestClose: React.PropTypes.func,
    open: React.PropTypes.bool,
  }
  state = {

  };
  componentWillReceiveProps(nextProps) {
    const lamp = this.props.lamp;
    let value = lamp.charwrite_text;
    let customTxt = '';
    if (!nextProps.modes.hasOwnProperty(lamp.charwrite_text)) {
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
  save = async () => {
    let mode = this.state.value;
    if (mode === 'custom') {
      mode = this.state.customTxt;
    }
    changeSegment(this.props.lamp, mode);
    this.props.onRequestClose();
  };
  setCustom = () => {
    this.setState({
      value: 'custom',
    });
  }
  handleChange = (e) => {
    this.setState({
      customTxt: e.target.value,
    });
  }
  handleRadioChange = (value) => {
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
                {_.map(modes, (name, id) => {
                  return (
                    <div style={{ lineHeight: '32px' }} key={id}>
                      <label>
                        <Radio style={{ marginRight: 5 }} value={id}/>
                        {name}
                      </label>
                    </div>
                  );
                })}
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
