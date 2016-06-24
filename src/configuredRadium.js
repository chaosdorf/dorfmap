/* @flow */
import Radium from 'radium';

export default function(component: any): any {
  const config = {};
  if (window.navigator.userAgent.indexOf('SeaMonkey') !== -1) {
    config.userAgent = 'foobar';
  }
  // $FlowFixMe
  return Radium(config)(component);
}
