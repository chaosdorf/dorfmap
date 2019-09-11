import { Vue, Component } from 'vue-property-decorator';
import axios from 'axios';

export interface MenuItem {
  name: string;
  entries: string[];
}

@Component
export default class OptionDialogsModel extends Vue {
  menues: MenuItem[] = [];
  services = {
    mete: 'https://mete.chaosdorf.space',
    prittstift: 'https://prittstift.chaosdorf.space',
    labello: 'http://labello.chaosdorf.space',
    mpd: 'https://ympd.chaosdorf.space',
    pulseWeb: 'https://pulseweb.chaosdorf.space',
  };

  async created() {
    this.menues = (await axios.get('/ajax/menu.json')).data;
  }
}
