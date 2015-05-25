import { FlatButton } from 'material-ui';
import './menuEntries.less';

export default class extends React.Component {
  render() {
    const entries = _.map(this.props.entries, entry => {
      return (
        <FlatButton label={entry}/>
      );
    });
    return (
      <div className="menuEntries">{entries}</div>
    );
  }
}
