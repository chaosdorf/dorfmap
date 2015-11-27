import _ from 'lodash';
import { Dialog, FlatButton, TextField } from 'material-ui';
import menuStore from '../Stores/menuStore.js';
import RadioGroup from 'react-radio-group';
import React from 'react';

export default class SegmentPopup extends React.Component {
  static propTypes = {
    lamp: React.PropTypes.object,
  }
  state = {
    disabled: false,
    modes: {},
  }
  componentDidMount() {
    menuStore.on('charwriteModes', this.updateModes);
  }
  componentWillUnmount() {
    menuStore.off('charwriteModes', this.updateModes);
  }
  updateModes = (modes) => {
    const lamp = this.props.lamp;
    let value = lamp.charwrite_text;
    let customTxt = '';
    if (!modes.hasOwnProperty(lamp.charwrite_text)) {
      value = 'custom';
      customTxt = lamp.charwrite_text;
    }
    this.setState({
      modes,
      value,
      customTxt,
    });
  }
  hide = () => {
    this.setState({
      open: false,
    });
  }
  show() {
    this.setState({
      open: true,
    });
    this.updateModes(menuStore.charwrite.toJS());
  }
  async save() {
    this.setState({
      disabled: true,
    });
    let mode = this.state.value;
    if (mode === 'custom') {
      mode = this.refs.custom.getValue();
    }
    await menuStore.saveCharwrite(this.props.lamp, mode);
    this.setState({
      disabled: false,
    });
    this.hide();
  }
  setCustom = () => {
    this.setState({
      value: 'custom',
    });
  }
  handleChange = () => {
    this.setState({
      customTxt: this.refs.custom.getValue(),
    });
  }
  handleRadioChange = (value) => {
    this.setState({
      value,
    });
  }
  handleRequestClose = () => {
    this.setState({
      open: false,
    });
  }
  render() {
    const { open, modes } = this.state;
    return (
      <Dialog
        ref="segmentDialog"
        onRequestClose={this.handleRequestClose}
        open={open}
        contentStyle={{ display: 'table', width: 'auto' }}>
        <div>
          <RadioGroup selectedValue={this.state.value} ref="radio" onChange={this.handleRadioChange}>
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
                    ref="custom"
                    value={this.state.customTxt}
                    onChange={this.handleChange}
                    onFocus={this.setCustom}
                    hintText="Custom"/>
                </div>
              </div>
            )}
          </RadioGroup>
          <div>
            <FlatButton label="Abbrechen" onClick={this.hide}/>
            <FlatButton disabled={this.state.disabled}
              label="Speichern" onClick={::this.save}/>
          </div>
        </div>
      </Dialog>
    );
  }
}
