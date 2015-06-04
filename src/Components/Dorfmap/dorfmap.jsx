import AboutHeader from '../AboutHeader/aboutHeader.jsx';
import OptionDialogs from '../OptionDialogs/optionDialogs.jsx';
import Map from '../Map/map.jsx';

import ThemeManager from 'material-ui/lib/styles/theme-manager';
const themeManager = new ThemeManager();

class Dorfmap extends React.Component {
  getChildContext() {
    return {
      muiTheme: themeManager.getCurrentTheme()
    };
  }
  render() {
    return (<div>
      <OptionDialogs/>
      <AboutHeader/>
      <Map/>
    </div>);
  }
}

Dorfmap.childContextTypes = {
  muiTheme: React.PropTypes.object
};

export default Dorfmap;
