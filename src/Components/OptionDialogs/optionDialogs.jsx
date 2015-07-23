import './optionDialogs.less';
import { RaisedButton } from 'material-ui';
import menuStore from '../../Stores/menuStore';
import OptionDialog from '../OptionDialog/optionDialog.jsx';
import React from 'react';


export default class extends React.Component {
  actions = {
    actions: 0,
    presets: 1,
    layers: 2
  }
  state = {}
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
    const menu = menuStore.menu.toJS();
    this.setState({
      title,
      menu
    });
    this.refs.optionDialog.show();
  }
  render() {
    return (
      <div>
        <div className="optionDialogs">
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
          ref="optionDialog"
          menu={this.state.menu}
          activeType={this.state.title}/>
      </div>
    );
  }
}
