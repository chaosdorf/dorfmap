import './AboutHeader.scss';
import React from 'react';

const AboutHeader = () => (
  <div className="AboutHeader">
    <a className="AboutHeader__link" href="https://github.com/chaosdorf/dorfmap">
      {'dorfmap'}
    </a>{' '}
    {'|'}{' '}
    <a className="AboutHeader__link" href="https://wiki.chaosdorf.de/Lichtsteuerung">
      {'about'}
    </a>{' '}
    {'|'}{' '}
    <a className="AboutHeader__link" href="https://wiki.chaosdorf.de/Lichtsteuerung#API">
      {'API'}
    </a>{' '}
    {'|'}{' '}
    <a className="AboutHeader__link" href="/space_api.json">
      {'spaceAPI'}
    </a>
  </div>
);

export default AboutHeader;
