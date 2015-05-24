global.React = require('react');
global.When = require('when');
global.Promise = global.When.Promise;
global.axios = require('axios');
global.EventEmitter = require('eventEmitter3');
global._ = require('lodash');
global.classNames = require('classnames');
require('./main.less');

function boundMethod(target, key, descriptor) {
  const fn = descriptor.value;

  if (typeof fn !== 'function') {
    throw new Error(`@autobind decorator can only be applied to methods not: ${typeof fn}`);
  }

  return {
    configurable: true,
    get() {
      const boundFn = fn.bind(this);
      Object.defineProperty(this, key, {
        value: boundFn,
        configurable: true,
        writable: true
      });
      return boundFn;
    }
  };
}

global.autoBind = function(target) {
  Object.getOwnPropertyNames(target.prototype)
  .forEach(key => {
    if (key === 'constructor') {
      return;
    }

    const descriptor = Object.getOwnPropertyDescriptor(target.prototype, key);

    if (typeof descriptor.value === 'function') {
      Object.defineProperty(target.prototype, key, boundMethod(target, key, descriptor));
    }
  });
};
