// @flow
import { Provider } from 'mobx-react';
import { setupPrimus } from '../primus';
import DeviceStore from 'Store/DeviceStore';
import Dorfmap from './Dorfmap';
import MenuStore from 'Store/MenuStore';
import React from 'react';

const menuStore = new MenuStore();
const deviceStore = new DeviceStore();

setupPrimus(deviceStore);

const App = () => (
  <Provider deviceStore={deviceStore} menuStore={menuStore}>
    <Dorfmap />
  </Provider>
);

export default App;
