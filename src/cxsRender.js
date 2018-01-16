// @flow
import * as React from 'react';
import { compact, flattenDeep, isEmpty } from 'lodash';
import classnames from 'classnames';
import cxs from 'cxs';
import prefixAll from 'inline-style-prefixer/static';

const transformProps = ({
  style,
  className,
  ...rest
}: {
  style?: Object | Object[],
  className?: string,
  rest?: any,
} = {}) => {
  if (!style) {
    return {
      className,
      ...rest,
    };
  }

  let combinedCss: { [key: string]: string | number };

  if (Array.isArray(style)) {
    const compactCss = compact(style);

    if (isEmpty(compactCss)) {
      return {
        className,
        ...rest,
      };
    }
    const flattended: any[] = flattenDeep(compactCss);

    combinedCss = Object.assign({}, ...flattended);
  } else {
    combinedCss = style || {};
  }

  Object.keys(combinedCss).forEach(key => {
    if (Number.isInteger(combinedCss[key])) {
      combinedCss[key] = `${combinedCss[key]}px`;
    }
  });

  // const prefixed = prefixAll(combinedCss);
  const cx = classnames(cxs(combinedCss), className);

  return {
    ...rest,
    className: cx,
  };
};

// eslint-disable-next-line
global.cxsReact = (tag: React.ElementType, originalProps: Object, ...children: React.Node[]) => {
  let props;

  if (originalProps) {
    props = transformProps(originalProps);
  }

  return React.createElement(tag, props, ...children);
};

global.cxsReactClone = (tag: any, originalProps: Object, ...children: React.Node[]) => {
  const props = transformProps(originalProps);

  return React.cloneElement(tag, props, ...children);
};
