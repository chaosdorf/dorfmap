<template>
  <div :class="$style.dorfmap">
    <Lamp v-for="lamp in devices" :lamp="lamp" :key="lamp.name" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import Devices from '@/store/Devices';
import { getModule } from 'vuex-module-decorators';
import Lamp from './Lamp.vue';

let initialitedSocket = false;
@Component({
  components: {
    Lamp,
  },
})
export default class Dorfmap extends Vue {
  devicesStore = getModule(Devices);
  get devices() {
    return this.devicesStore.devices.filter(
      d => d.layer === this.devicesStore.currentLayer
    );
  }
  created() {
    // @ts-ignore
    // eslint-disable-next-line no-undef
    if (global.EventSource && !initialitedSocket) {
      try {
        // @ts-ignore
        // eslint-disable-next-line no-undef
        const stream = new EventSource(`${SOCKET_URL}/events`);

        stream.onmessage = (e: any) => {
          if (e.data !== 'PING') {
            this.devicesStore.fetchDevices();
          }
        };
        initialitedSocket = true;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Real time updates not working');
      }
    } else {
      // eslint-disable-next-line no-console
      console.warn('Real time updates not working');
    }
  }
}
</script>

<style module>
.dorfmap {
  background-image: url('../assets/map.png');
  width: 2202px;
  height: 648px;
  margin-left: 5px;
  margin-right: 5px;
  position: relative;
}
</style>
