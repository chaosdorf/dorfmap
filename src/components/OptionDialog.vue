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
import { getModule, Module } from 'vuex-module-decorators';
import OptionDialogsStore from '@/store/OptionDialogs';
import Devices from '@/store/Devices';

@Component
export default class OptionDialog extends Vue {
  @Prop() openTab?: number;
  devicesStore = getModule(Devices);
  optionDialogsState = getModule(OptionDialogsStore);
  selectedTab = 0;

  mounted() {
    this.selectedTab = this.openTab || 0;
  }

  get menues() {
    return this.optionDialogsState.menues;
  }
  execute(type: string, entry: string) {
    switch (type) {
      case 'layers':
        this.devicesStore.setCurrentLayer(entry);
        break;
      case 'presets':
        this.devicesStore.executePreset(entry);
        break;
      case 'actions':
        this.devicesStore.executeShortcut(entry);
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
