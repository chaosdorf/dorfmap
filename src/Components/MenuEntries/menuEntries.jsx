import { FlatButton } from 'material-ui';
import lampStore from '../../Stores/lampStore.js';
import './menuEntries.less';


class MenuEntries extends React.Component {
  handleClick(entry) {
    switch (this.props.type) {
      case 'layers':
      lampStore.updateLayer(entry);
      break;
      case 'presets':
      lampStore.executePreset(entry);
      break;
      case 'actions':
      lampStore.executeShortcut(entry);
      break;
    }
    this.props.closeFn();
  }
  render() {
    const entries = _.map(this.props.entries, entry => {
      return (
        <FlatButton key={entry} label={entry} onClick={this.handleClick.bind(this, entry)}/>
      );
    });
    return (
      <div className="menuEntries">{entries}</div>
    );
  }
}

MenuEntries.PropTypes = {
  entries: React.PropTypes.array
};

export default MenuEntries;
