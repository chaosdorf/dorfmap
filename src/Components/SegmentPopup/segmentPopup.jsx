import { Dialog, FlatButton, TextField } from 'material-ui';
import RadioGroup from 'react-radio-group';
import React from 'react';
import menuStore from '../../Stores/menuStore.js';

export default class extends React.Component {
  state = {
    disabled: false,
    modes: {}
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
      customTxt
    });
  }
  hide = () => {
    this.refs.segmentDialog.dismiss();
  }
  show() {
    this.refs.segmentDialog.show();
    this.updateModes(menuStore.charwrite.toJS());
  }
  async save() {
    this.setState({
      disabled: true
    });
    let mode = this.refs.radio.getCheckedValue();
    if (mode === 'custom') {
      mode = this.refs.custom.getValue();
    }
    await menuStore.saveCharwrite(this.props.lamp, mode);
    this.setState({
      disabled: false
    });
    this.hide();
  }
  setCustom = () => {
    this.setState({
      value: 'custom'
    });
  }
  handleChange = () => {
    this.setState({
      customTxt: this.refs.custom.getValue()
    });
  }
  handleRadioChange = () => {
    this.setState({
      value: this.refs.radio.getCheckedValue()
    });
  }
  render() {
    const modes = this.state.modes;
    return (
      <Dialog
        ref="segmentDialog"
        modal={false}
        contentStyle={{display: 'table', width: 'auto'}}>
        <RadioGroup value={this.state.value} ref="radio" onChange={this.handleRadioChange}>
          {_.map(modes, (name, id) => {
            return (
              <div style={{lineHeight: '32px'}} key={id}>
                <label>
                  <input style={{marginRight: '5px'}} value={id} type="radio"/>
                  {name}
                </label>
              </div>
            );
          })}
          <div>
            <input value="custom" style={{marginRight: '5px'}} type="radio"/>
            <TextField
              ref="custom"
              value={this.state.customTxt}
              onChange={this.handleChange}
              onFocus={this.setCustom}
              hintText="Custom"/>
          </div>
        </RadioGroup>
        <div>
          <FlatButton label="Abbrechen" onClick={this.hide}/>
          <FlatButton disabled={this.state.disabled}
            label="Speichern" onClick={::this.save}/>
        </div>
      </Dialog>
    );
  }
}
