import './OptionDialogs.scss';
import { AppState } from 'AppState';
import { connect, ResolveThunks } from 'react-redux';
import { map } from 'lodash';
import Actions, { fetchMenues } from 'actions/menu';
import Button from '@material-ui/core/Button';
import OptionDialog from './OptionDialog';
import React, { useCallback, useEffect, useState } from 'react';

type StateProps = {
  services: AppState['menu']['services'];
};

type DispatchProps = ResolveThunks<{
  fetchMenues: typeof fetchMenues;
  setSelectedTab: typeof Actions.setSelectedTab;
}>;

type Props = StateProps & DispatchProps;

const OptionDialogs = ({ fetchMenues, setSelectedTab, services }: Props) => {
  useEffect(() => fetchMenues(), [fetchMenues]);
  const [open, setOpen] = useState(false);
  const handleClick = useCallback(
    (action: string) => {
      setSelectedTab(undefined, action);
      setOpen(true);
    },
    [setSelectedTab]
  );
  const handleRequestClose = useCallback(() => setOpen(false), []);

  return (
    <>
      <div className="OptionDialogs">
        <div>
          <Button onClick={() => handleClick('actions')}>Actions</Button>
          <Button onClick={() => handleClick('presets')}>Presets</Button>
          <Button onClick={() => handleClick('layers')}>Layers</Button>
        </div>
        <div>
          {map(services, (href, name) => (
            <a key={name} href={href} target="_blank" rel="noopener noreferrer">
              <Button>{name}</Button>
            </a>
          ))}
        </div>
      </div>

      {open && <OptionDialog handleRequestClose={handleRequestClose} />}
    </>
  );
};

export default connect<StateProps, DispatchProps, {}, AppState>(
  state => ({
    services: state.menu.services,
  }),
  {
    fetchMenues,
    setSelectedTab: Actions.setSelectedTab,
  }
)(OptionDialogs);
