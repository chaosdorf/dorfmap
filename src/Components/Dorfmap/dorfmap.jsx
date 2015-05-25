import AboutHeader from '../AboutHeader/aboutHeader.jsx';
import OptionDialogs from '../OptionDialogs/optionDialogs.jsx';
import Map from '../Map/map.jsx';

export default class extends React.Component {

  render() {
    return (<div>
      <OptionDialogs/>
      <AboutHeader/>
      <Map/>
    </div>);
  }
}
