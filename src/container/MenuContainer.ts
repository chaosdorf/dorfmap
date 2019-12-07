import { createContainer } from 'unstated-next';
import { useEffect, useState } from 'react';
import Axios from 'axios';

interface Menu {
  name: string;
  entries: string[];
}
type Menues = Record<string, string[]>;
const useMenu = () => {
  const [menues, setMenues] = useState<Menues>({});
  const [selectedTab, setSelectedTab] = useState<string>('action');

  useEffect(() => {
    Axios.get('/ajax/menu.json').then(r => {
      const menu: Menues = r.data.reduce((menues: Menues, m: Menu) => {
        menues[m.name] = m.entries;

        return menues;
      }, {});

      setMenues(menu);
    });
  }, []);

  return {
    menues,
    selectedTab,
    setSelectedTab,
  };
};

export default createContainer(useMenu);
