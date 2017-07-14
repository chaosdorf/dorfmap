// @flow
import { inject } from 'mobx-react';
import FlatButton from 'material-ui/FlatButton';
import OptionDialog from './OptionDialog';
import React from 'react';

type State = {
  open?: boolean,
  title?: string,
};

@inject('menuStore')
export default class OptionDialogs extends React.Component {
  actions: Object = {
    actions: 0,
    presets: 1,
    layers: 2,
  };
  state: State = {};
  componentWillMount() {
    this.props.menuStore.fetchMenues();
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
  handleActionsClick = () => {
    this.handleClick(this.actions.actions);
  };
  handlePresetsClick = () => {
    this.handleClick(this.actions.presets);
  };
  handleLayersClick = () => {
    this.handleClick(this.actions.layers);
  };
  handleRequestClose = () => {
    this.setState({ open: false });
  };
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
        <div style={style.dialogs} className="optionDialogs">
          <div>
            <FlatButton onClick={this.handleActionsClick}>
              {'Actions'}
            </FlatButton>
            <FlatButton onClick={this.handlePresetsClick}>
              {'Presets'}
            </FlatButton>
            <FlatButton onClick={this.handleLayersClick}>
              {'Layers'}
            </FlatButton>
          </div>
          <div>
            <FlatButton onClick={this.toMete}>
              {'Mete'}
            </FlatButton>
            <FlatButton onClick={this.toLabello}>
              {'Labello'}
            </FlatButton>
            <FlatButton onClick={this.toMPD}>
              {'MPD'}
            </FlatButton>
          </div>
        </div>

        <OptionDialog
          activeType={this.state.title}
          handleRequestClose={this.handleRequestClose}
          open={this.state.open}
        />
      </div>
    );
  }
}

const style = {
  dialogs: {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: 5,
    marginLeft: 10,
    width: '70%',
  },
};
