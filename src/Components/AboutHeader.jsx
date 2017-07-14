// @flow
import React from 'react';

const AboutHeader = () =>
  <div style={style.wrapper}>
    <span>
      <a style={style.link} href="https://github.com/chaosdorf/dorfmap">
        {'dorfmap'}
      </a>{' '}
      {'|'}{' '}
    </span>
    <span>
      <a style={style.link} href="https://wiki.chaosdorf.de/Lichtsteuerung">
        {'about'}
      </a>{' '}
      {'|'}{' '}
    </span>
    <span>
      <a style={style.link} href="https://wiki.chaosdorf.de/Lichtsteuerung#API">
        {'API'}
      </a>{' '}
      {'|'}{' '}
    </span>
    <span>
      <a style={style.link} href="/space_api.json">
        {'spaceAPI'}
      </a>
    </span>
  </div>;

export default AboutHeader;

const style = {
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
