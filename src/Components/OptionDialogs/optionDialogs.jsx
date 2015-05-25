import './optionDialogs.less';

import { RaisedButton, Dialog } from 'material-ui';

import menuStore from '../../Stores/menuStore';
import MenuEntries from '../MenuEntries/menuEntries.jsx'
;

export default class extends React.Component {
  actions = {
    actions: 0,
    presets: 1,
    layer: 2
  }
  state = {}
  handleClick(action) {
    let title;
    switch (action) {
      case this.actions.actions:
      title = 'Actions';
      break;
      case this.actions.presets:
      title = 'Presets';
      break;
      case this.actions.layer:
      title = 'Layer';
      break;
      default:
      break;
    }
    const menu = menuStore.menu.get(title.toLowerCase());
    this.setState({
      title,
      menu
    });
    this.refs.optionsDialog.show();
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
            onTouchTap={this.handleClick.bind(this, this.actions.layer)}
            label="Layer"/>
        </div>

        <Dialog
          ref="optionsDialog"
          modal={false}
          title={this.state.title}>
          <MenuEntries entries={this.state.menu}/>
        </Dialog>
      </div>
    );
  }
}
