import './aboutHeader.less';

export default class extends React.Component {
  render() {
    return (
      <div className="about">
        <span><a href="https://github.com/chaosdorf/dorfmap">dorfmap</a> | </span>
        <span><a href="https://wiki.chaosdorf.de/Lichtsteuerung">about</a> | </span>
        <span><a href="https://wiki.chaosdorf.de/Lichtsteuerung#API">API</a> | </span>
        <span><a href="/space_api.json">spaceAPI</a></span>
      </div>
    );
  }
}
