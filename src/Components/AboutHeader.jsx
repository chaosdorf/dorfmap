/* @flow */
import ConfiguredRadium from 'configuredRadium';
import React from 'react';

@ConfiguredRadium
export default class AboutHeader extends React.Component {
  static style = {
    wrapper: {
      position: 'fixed',
      top: 5,
      right: 15,
      fontFamily: 'Monospace',
      fontSize: 'smaller',
    },
    link: {
      color: '#006',
      textDecoration: 'none',
      margin: 5,
    },
  };
  render() {
    const style = AboutHeader.style;
    return (
      <div style={style.wrapper}>
        <span><a style={style.link} href="https://github.com/chaosdorf/dorfmap">dorfmap</a> | </span>
        <span><a style={style.link} href="https://wiki.chaosdorf.de/Lichtsteuerung">about</a> | </span>
        <span><a style={style.link} href="https://wiki.chaosdorf.de/Lichtsteuerung#API">API</a> | </span>
        <span><a style={style.link} href="/space_api.json">spaceAPI</a></span>
      </div>
    );
  }
}
