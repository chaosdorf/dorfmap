import { RaisedButton } from 'material-ui';
import { fetchMenues } from '../Actions/menu';
import OptionDialog from './OptionDialog';
import ConfiguredRadium from 'configuredRadium';
import React from 'react';

@ConfiguredRadium
export default class OptionDialogs extends React.Component {
  static style = {
    dialogs: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: 5,
      marginLeft: 5,
      width: 400,
    },
  };
  actions = {
    actions: 0,
    presets: 1,
    layers: 2,
  };
  state = {};
  componentWillMount() {
    fetchMenues();
  }
  handleClick(action) {
    let title;
    switch (action) {
      case this.actions.actions:
      title = 'actions';
      break;
      case this.actions.presets:
      title = 'presets';
      break;
      case this.actions.layers:
      title = 'layers';
      break;
      default:
      break;
    }
    this.setState({
      title,
      open: true,
    });
  }
  handleRequestClose = () => {
    this.setState({ open: false });
  }
  render() {
    return (
      <div>
        <div style={OptionDialogs.style.dialogs} className="optionDialogs">
          <RaisedButton
            onTouchTap={this.handleClick.bind(this, this.actions.actions)}
            label="Actions"/>
          <RaisedButton
            onTouchTap={this.handleClick.bind(this, this.actions.presets)}
            label="Presets"/>
          <RaisedButton
            onTouchTap={this.handleClick.bind(this, this.actions.layers)}
            label="Layers"/>
        </div>

        <OptionDialog
          activeType={this.state.title}
          handleRequestClose={this.handleRequestClose}
          open={this.state.open}/>
      </div>
    );
  }
}
