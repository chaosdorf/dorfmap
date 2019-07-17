<template>
  <div :class="$style.main">
    <div>
      <b-button type="is-primary" outlined @click="openTab = 1"
        >Actions</b-button
      >
      <b-button type="is-primary" outlined @click="openTab = 2"
        >Presets</b-button
      >
      <b-button type="is-primary" outlined @click="openTab = 3"
        >Layers</b-button
      >
    </div>
    <b-modal :active.sync="dialogOpen" has-modal-card>
      <OptionDialog :openTab="openTab - 1" />
    </b-modal>
    <div>
      <a
        v-for="(href, name) in services"
        :key="name"
        :href="href"
        target="_blank"
        rel="noopener noreferrer"
      >
        <b-button>{{ name }}</b-button>
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Provide, Component } from 'vue-property-decorator';
import OptionDialogsStore from '@/store/OptionDialogs';
import { getModule } from 'vuex-module-decorators';
import OptionDialog from './OptionDialog.vue';

@Component({
  components: {
    OptionDialog,
  },
})
export default class OptionDialogs extends Vue {
  optionDialogsState = getModule(OptionDialogsStore);
  openTab = 0;
  get dialogOpen() {
    return Boolean(this.openTab);
  }
  set dialogOpen(value: boolean) {
    if (value) this.openTab = 1;
    else this.openTab = 0;
  }

  get services() {
    return this.optionDialogsState.services;
  }
  mounted() {
    this.optionDialogsState.fetchMenues();
  }
}
</script>

<style module>
.main {
  display: flex;
  justify-content: space-around;
  margin-top: 5px;
  margin-left: 10px;
  width: 70%;
}
</style>
