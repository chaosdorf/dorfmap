import React from 'react';
import useStyles from './AboutHeader.style';

const AboutHeader = () => {
  const classes = useStyles();

  return (
    <div className={classes.main}>
      <a className={classes.link} href="https://github.com/chaosdorf/dorfmap">
        {'dorfmap'}
      </a>{' '}
      {'|'}{' '}
      <a
        className={classes.link}
        href="https://wiki.chaosdorf.de/Lichtsteuerung"
      >
        {'about'}
      </a>{' '}
      {'|'}{' '}
      <a
        className={classes.link}
        href="https://wiki.chaosdorf.de/Lichtsteuerung#API"
      >
        {'API'}
      </a>{' '}
      {'|'}{' '}
      <a className={classes.link} href="/space_api.json">
        {'spaceAPI'}
      </a>
    </div>
  );
};

export default AboutHeader;
