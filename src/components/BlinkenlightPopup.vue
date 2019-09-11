<template>
  <div class="modal-card">
    <section v-if="options" :class="['modal-card-body', $style.body]">
      <b-radio
        :class="$style.radio"
        v-for="preset in options.presets"
        v-model="selectedOptions"
        :native-value="preset.raw_string"
        :key="preset.name"
        >{{ preset.name }}</b-radio
      >
    </section>
    <footer class="modal-card-foot">
      <b-button type="is-primary" @click="$parent.close()" outlined
        >Cancel</b-button
      >
      <b-button type="is-primary" outlined @click="savePreset()">Save</b-button>
    </footer>
  </div>
</template>

<script lang="ts">
import { Vue, Prop, Component } from 'vue-property-decorator';
import Devices, { Lamp } from '@/models/DevicesModel';
import { InjectModel } from '@sum.cumo/vue-states';
import DevicesModel from '@/models/DevicesModel';

@Component
export default class BlinkenlightPopup extends Vue {
  $parent: any;
  @InjectModel Devices!: DevicesModel;
  @Prop() readonly lamp!: Lamp;
  get selectedOptions() {
    return this.options && this.options.active
      ? this.options.active.raw_string
      : '32,0,0,0';
  }
  set selectedOptions(rawString: string) {
    this.options.active = this.options.presets.find(
      p => p.raw_string === rawString
    );
  }
  get options() {
    return this.Devices.blinkenlightOptions[this.lamp.name];
  }
  savePreset() {
    this.Devices.saveBlinkenlightOption({
      device: this.lamp.name,
      raw_string: this.selectedOptions,
    }).then(() => {
      // @ts-ignore
      this.$parent.close();
    });
  }
  mounted() {
    this.Devices.fetchBlinkenlightOptions(this.lamp.name);
  }
}
</script>

<style module>
.body {
  display: flex;
  flex-direction: column;
}
.radio {
  margin-left: 0.5em;
  margin-bottom: 0.5em;
}
</style>
