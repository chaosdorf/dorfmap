import React from 'react';
import menuStore from '../Stores/menuStore.js';
import {Dialog, FlatButton} from 'material-ui';
import RadioGroup from 'react-radio-group';
import Radium from 'radium';

@Radium
export default class BlinkenlightPopup extends React.Component {
  state = {
  }
  componentWillMount() {
    this.update();
  }
  update() {
    menuStore.getBlinkenlight(this.props.lamp.name).then(data => {
      this.setState({
        presets: data.presets,
        active: data.active && data.active.raw_string
      });
    });
  }
  hide = () => {
    this.refs.blinkenlightPopup.dismiss();
  }
  show() {
    this.refs.blinkenlightPopup.show();
    this.update();
  }
  save() {
    menuStore.saveBlinkenlight(this.props.lamp, this.state.active);
    this.hide();
  }
  handleRadioChange = () => {
    this.setState({
      active: this.refs.radio.getCheckedValue()
    });
  }
  render() {
    return (
      <Dialog
        modal={false}
        contentStyle={{display: 'table', width: 'auto'}}
        ref="blinkenlightPopup">
        <RadioGroup value={this.state.active} ref="radio" onChange={this.handleRadioChange}>
          {
            _.map(this.state.presets, (preset) => {
              return (
                <div style={{lineHeight: '32px'}} key={preset.name}>
                  <label>
                    <input style={{marginRight: 5}} value={preset.raw_string} type="radio"/>
                    {preset.name}
                  </label>
                </div>
              );
            })
          }
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
