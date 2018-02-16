// @flow
import React from 'react';
import styles from './AboutHeader.scss';

const AboutHeader = () => (
  <div className={styles.wrapper}>
    <span>
      <a className={styles.link} href="https://github.com/chaosdorf/dorfmap">
        {'dorfmap'}
      </a>{' '}
      {'|'}{' '}
    </span>
    <span>
      <a className={styles.link} href="https://wiki.chaosdorf.de/Lichtsteuerung">
        {'about'}
      </a>{' '}
      {'|'}{' '}
    </span>
    <span>
      <a className={styles.link} href="https://wiki.chaosdorf.de/Lichtsteuerung#API">
        {'API'}
      </a>{' '}
      {'|'}{' '}
    </span>
    <span>
      <a className={styles.link} href="/space_api.json">
        {'spaceAPI'}
      </a>
    </span>
  </div>
);

export default AboutHeader;
