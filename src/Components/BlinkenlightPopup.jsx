import RadioGroup from 'react-radio-group';
import Radium from 'radium';
import React from 'react';
import menuStore from '../Stores/menuStore.js';
import { Dialog, FlatButton } from 'material-ui';

@Radium
export default class BlinkenlightPopup extends React.Component {
  static propTypes = {
    active: React.PropTypes.bool,
    lamp: React.PropTypes.object,
  }
  state = {}
  componentWillMount() {
    this.update();
  }
  update() {
    menuStore.getBlinkenlight(this.props.lamp.name).then(data => {
      this.setState({
        presets: data.presets,
        active: data.active && data.active.raw_string,
      });
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
    this.update();
  }
  save() {
    menuStore.saveBlinkenlight(this.props.lamp, this.state.active);
    this.hide();
  }
  handleRequestClose = () => {
    this.setState({
      open: false,
    });
  }
  handleRadioChange = (value) => {
    this.setState({
      active: value,
    });
  }
  render() {
    const { open } = this.state;
    return (
      <Dialog
        onRequestClose={this.handleRequestClose}
        open={open}
        contentStyle={{ display: 'table', width: 'auto' }}
        ref="blinkenlightPopup">
        <div>
          <RadioGroup selectedValue={this.state.active} ref="radio" onChange={this.handleRadioChange}>
            {
              Radio => (
                <div>
                  {
                    _.map(this.state.presets, (preset) => {
                      return (
                        <div style={{ lineHeight: '32px' }} key={preset.name}>
                          <label>
                            <Radio style={{ marginRight: 5 }} value={preset.raw_string}/>
                            {preset.name}
                          </label>
                        </div>
                      );
                    })
                  }
                </div>
              )
            }
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
