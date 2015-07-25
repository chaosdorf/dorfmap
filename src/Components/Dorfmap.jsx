import AboutHeader from './AboutHeader.jsx';
import Map from './Map.jsx';
import OptionDialogs from './OptionDialogs.jsx';
import Radium from 'radium';
import React from 'react';
import ThemeManager from 'material-ui/lib/styles/theme-manager';

const themeManager = new ThemeManager();

@Radium
export default class Dorfmap extends React.Component {
  static childContextTypes = {
    muiTheme: React.PropTypes.object
  }
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
