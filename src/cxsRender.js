// @flow
import * as React from 'react';
import { compact, flattenDeep, isEmpty } from 'lodash';
import classnames from 'classnames';
import cxs from 'cxs';
import Prefixer from 'inline-style-prefixer';

const prefixer = new Prefixer();

export const prefixStyles = (styles: Object) => prefixer.prefix(styles);

export const transformProps = (
  {
    style,
    className,
    ...rest
  }: {
    style?: Object | Object[],
    className?: string,
    rest?: any,
  } = {}
) => {
  if (!style) {
    return {
      className,
      ...rest,
    };
  }

  let combinedCss;

  if (Array.isArray(style)) {
    const compactCss = compact(style);

    if (isEmpty(compactCss)) {
      return {
        className,
        ...rest,
      };
    }
    combinedCss = Object.assign({}, ...flattenDeep(compactCss));
  } else {
    combinedCss = style || {};
  }

  const cx = classnames(cxs(prefixStyles(combinedCss)), className);

  return {
    ...rest,
    className: cx,
  };
};

// eslint-disable-next-line
global.cxsReact = (tag: any, originalProps: any, ...children: any[]) => {
  let props;

  if (originalProps) {
    props = transformProps(originalProps);
  } else {
    props = originalProps;
  }

  return React.createElement(tag, props, ...children);
};

global.cxsReactClone = (tag: any, originalProps: any, ...children: any[]) => {
  const props = transformProps(originalProps);

  return React.cloneElement(tag, props, ...children);
};
