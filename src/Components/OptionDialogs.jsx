/* @flow */
import { autobind } from 'core-decorators';
import { fetchMenues } from '../Actions/menu';
import { Button } from 'rebass';
import ConfiguredRadium from 'configuredRadium';
import OptionDialog from './OptionDialog';
import React from 'react';

type State = {
  open?: bool,
  title?: string,
}

@ConfiguredRadium
export default class OptionDialogs extends React.Component {
  static style = {
    dialogs: {
      display: 'flex',
      justifyContent: 'space-around',
      marginTop: 5,
      marginLeft: 10,
      width: '70%',
    },
  };
  actions: Object = {
    actions: 0,
    presets: 1,
    layers: 2,
  };
  state: State = {};
  componentWillMount() {
    fetchMenues();
  }
  handleClick(action: number) {
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
  @autobind
  handleActionsClick() {
    this.handleClick(this.actions.actions);
  }
  @autobind
  handlePresetsClick() {
    this.handleClick(this.actions.presets);
  }
  @autobind
  handleLayersClick() {
    this.handleClick(this.actions.layers);
  }
  @autobind
  handleRequestClose() {
    this.setState({ open: false });
  }
  toMete() {
    window.open('https://mete.chaosdorf.space');
  }
  toLabello() {
    window.open('http://labello.chaosdorf.space');
  }
  toMPD() {
    window.open('https://mpd.chaosdorf.space');
  }
  render() {
    return (
      <div>
        <div style={OptionDialogs.style.dialogs} className="optionDialogs">
          <div>
            <Button rounded="left" onClick={this.handleActionsClick}>Actions</Button>
            <Button rounded={false} onClick={this.handlePresetsClick}>Presets</Button>
            <Button rounded="right" onClick={this.handleLayersClick}>Layers</Button>
          </div>
          <div>
            <Button rounded="left" onClick={this.toMete}>Mete</Button>
            <Button rounded={false} onClick={this.toLabello}>Labello</Button>
            <Button rounded="right" onClick={this.toMPD}>MPD</Button>
          </div>
        </div>

        <OptionDialog
          activeType={this.state.title}
          handleRequestClose={this.handleRequestClose}
          open={this.state.open}/>
      </div>
    );
  }
}
