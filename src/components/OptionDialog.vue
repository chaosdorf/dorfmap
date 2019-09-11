<template>
  <div class="modal-card">
    <b-tabs
      :animated="false"
      expanded
      class="modal-card-body"
      v-model="selectedTab"
    >
      <b-tab-item
        :class="$style.entries"
        :key="menu.name"
        v-for="menu in menues"
        :label="menu.name"
        ><b-button
          @click="execute(menu.name, entry)"
          :class="$style.button"
          type="is-primary"
          outlined
          :key="entry"
          v-for="entry in menu.entries"
          >{{ entry }}</b-button
        ></b-tab-item
      >
    </b-tabs>
  </div>
</template>

<script lang="ts">
import { Vue, Prop, Component } from 'vue-property-decorator';
import { InjectModel } from '@sum.cumo/vue-states';
import DevicesModel from '@/models/DevicesModel';
import OptionDialogsModel from '@/models/OptionDialogsModel';

@Component
export default class OptionDialog extends Vue {
  @InjectModel OptionDialogs!: OptionDialogsModel;
  @Prop() openTab?: number;
  @InjectModel Devices!: DevicesModel;
  selectedTab = 0;

  mounted() {
    this.selectedTab = this.openTab || 0;
  }

  get menues() {
    return this.OptionDialogs.menues;
  }
  execute(type: string, entry: string) {
    switch (type) {
      case 'layers':
        this.Devices.setCurrentLayer(entry);
        break;
      case 'presets':
        this.Devices.executePreset(entry);
        break;
      case 'actions':
        this.Devices.executeShortcut(entry);
        break;
    }
    // @ts-ignore
    this.$parent.close();
  }
}
</script>

<style module>
.entries {
  display: flex;
  flex-direction: column;
}
.button {
  margin: 2px 0 2px;
}
</style>
