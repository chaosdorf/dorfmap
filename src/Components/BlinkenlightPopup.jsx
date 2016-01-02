import _ from 'lodash';
import { connect } from 'react-redux';
import { fetchPresets, saveBlinkenlight } from '../Actions/devices';
import { Dialog, FlatButton } from 'material-ui';
import RadioGroup from 'react-radio-group';
import ConfiguredRadium from 'configuredRadium';
import React from 'react';

@ConfiguredRadium
@connect(state => ({
  presets: state.presets,
}))
export default class BlinkenlightPopup extends React.Component {
  static propTypes = {
    lamp: React.PropTypes.object,
    onRequestClose: React.PropTypes.func,
    open: React.PropTypes.bool,
    presets: React.PropTypes.object,
  };
  state = {}
  componentWillMount() {
    fetchPresets(this.props.lamp);
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.presets && nextProps.presets[nextProps.lamp.name] && nextProps.presets[nextProps.lamp.name].active) {
      this.setState({
        active: nextProps.presets[nextProps.lamp.name].active.raw_string,
      });
    }
  }
  save = () => {
    saveBlinkenlight(this.props.lamp, this.state.active);
    this.props.onRequestClose();
  }
  handleRadioChange = (value) => {
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
      <Dialog
        onRequestClose={onRequestClose}
        open={open}
        contentStyle={{ display: 'table', width: 'auto' }}>
        <div>
          <RadioGroup selectedValue={active} ref="radio" onChange={this.handleRadioChange}>
            {
              Radio => (
                <div>
                  {
                    _.map(actualPresets, (preset) => {
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
            <FlatButton label="Abbrechen" onClick={onRequestClose}/>
            <FlatButton label="Speichern" onClick={this.save}/>
          </div>
        </div>
      </Dialog>
    );
  }
}
