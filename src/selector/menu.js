// @flow
/* eslint import/prefer-default-export: 0 */
import { createSelector } from 'reselect';
import type { AppState } from 'AppState';

const servicesSelector = (state: AppState) => state.menu.services;

export const internalServices = createSelector(servicesSelector, services =>
  services.map(url => () => window.open(url))
);
