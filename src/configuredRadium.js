/* @flow */
import Radium from 'radium';

export default function(component: ReactClass): ReactClass {
  const config = {};
  if (window.navigator.userAgent.indexOf('SeaMonkey') !== -1) {
    config.userAgent = 'foobar';
  }
  return Radium(config)(component);
}
