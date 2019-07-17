<template>
  <div>
    <b-tooltip
      position="is-right"
      v-for="(lampC, i) in lamps"
      :key="i"
      :label="tooltipText"
      :style="{
        left: `${lampC.x1}px`,
        top: `${lampC.y1}px`,
        width: `${lampC.x2}px`,
        height: `${lampC.y2}px`,
      }"
      class="lamp"
    >
      <img
        @click="toggle"
        :class="{ writeable: writeable }"
        :src="lamp.image"
      />
    </b-tooltip>
    <b-modal
      v-if="isBlinkenlight"
      :active.sync="blinkenlightOpen"
      has-modal-card
    >
      <BlinkenlightPopup :lamp="lamp" />
    </b-modal>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Lamp as LampType } from '@/store/Devices';
import Devices from '@/store/Devices';
import { getModule } from 'vuex-module-decorators';
import he from 'he';
import BlinkenlightPopup from './BlinkenlightPopup.vue';

@Component({
  components: {
    BlinkenlightPopup,
  },
})
export default class Lamp extends Vue {
  @Prop() readonly lamp!: LampType;
  devicesStore = getModule(Devices);
  blinkenlightOpen = false;
  get isBlinkenlight() {
    return this.lamp.type === 'blinkenlight';
  }
  toggle() {
    switch (this.lamp.type) {
      case 'blinkenlight':
        this.blinkenlightOpen = !this.blinkenlightOpen;
        break;
      default:
        if (this.writeable) {
          this.devicesStore.toggleDevice(this.lamp.name);
        }
        break;
    }
  }
  tooltipText: string = '';
  reducingDelay: boolean = false;
  get lamps() {
    return [...(this.lamp.duplicates || []), this.lamp];
  }
  beforeUpdate() {
    this.initDelayCheck();
  }
  initDelayCheck() {
    if (!this.reducingDelay) {
      this.checkDelay();
    }
  }
  get writeable() {
    return (
      this.lamp.is_writable &&
      (this.lamp.rate_delay <= 0 || this.lamp.status === 1)
    );
  }
  checkDelay() {
    let baseText = `${he
      .unescape(this.lamp.status_text || '')
      .replace('<br/>', '  ')}`;
    if (this.lamp.rate_delay > 0 && this.lamp.status === 0) {
      this.reducingDelay = true;
      baseText += ` (${this.lamp.rate_delay}s)`;
      setTimeout(() => {
        this.lamp.rate_delay -= 1;
        this.$forceUpdate();
        this.checkDelay();
      }, 1000);
    } else {
      this.reducingDelay = false;
    }
    this.tooltipText = baseText;
  }
  mounted() {
    this.initDelayCheck();
  }
}
</script>

<style lang="scss" scoped>
.lamp {
  position: absolute;
}
.writeable {
  cursor: pointer;
  transition: 300ms linear;
  &:hover {
    transform: scale(1.3);
  }
}
.modal-card {
  width: auto;
}
</style>
