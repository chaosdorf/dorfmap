// @flow
import './AboutHeader.scss';
import React from 'react';

const AboutHeader = () => (
  <div className="AboutHeader">
    <span>
      <a className="AboutHeader__link" href="https://github.com/chaosdorf/dorfmap">
        {'dorfmap'}
      </a>{' '}
      {'|'}{' '}
    </span>
    <span>
      <a className="AboutHeader__link" href="https://wiki.chaosdorf.de/Lichtsteuerung">
        {'about'}
      </a>{' '}
      {'|'}{' '}
    </span>
    <span>
      <a className="AboutHeader__link" href="https://wiki.chaosdorf.de/Lichtsteuerung#API">
        {'API'}
      </a>{' '}
      {'|'}{' '}
    </span>
    <span>
      <a className="AboutHeader__link" href="/space_api.json">
        {'spaceAPI'}
      </a>
    </span>
  </div>
);

export default AboutHeader;
