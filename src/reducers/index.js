// @flow
import { combineReducers } from 'redux';
import device from './device';
import menu from './menu';

export default combineReducers<*, *>({ device, menu });
