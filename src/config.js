import {Route, DefaultRoute, RouteHandler} from 'react-router';
import Dorfmap from './Components/Dorfmap/dorfmap.jsx';


class App extends React.Component {
  render() {
    return (<RouteHandler/>);
  }
}

export var routes = (
  <Route handler={App} path="/">
    <DefaultRoute handler={Dorfmap}/>
  </Route>
);
