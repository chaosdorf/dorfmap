<template>
  <div id="app">
    <OptionDialogs />
    <AboutHeader />
    <Dorfmap />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Dorfmap from './components/Dorfmap.vue';
import AboutHeader from './components/AboutHeader.vue';
import OptionDialogs from './components/OptionDialogs.vue';
import DevicesModel from '@/models/DevicesModel';

@Component({
  components: {
    Dorfmap,
    AboutHeader,
    OptionDialogs,
  },
  models() {
    return { Devices: DevicesModel };
  },
})
export default class App extends Vue {
  Devices!: DevicesModel;
}
</script>

<style lang="scss">
@import '~bulma/sass/utilities/initial-variables';
@import '~buefy/src/scss/utils/all';
@import '~bulma/sass/utilities/all';
@import '~bulma/sass/base/all';
@import '~bulma/sass/form/shared';
@import '~bulma/sass/elements/button';
@import '~bulma/sass/elements/container';
@import '~bulma/sass/components/modal';
@import '~bulma/sass/components/tabs';
@import '~buefy/src/scss/components/radio';
@import '~buefy/src/scss/components/tooltip';
@import '~buefy/src/scss/components/modal';
@import '~buefy/src/scss/components/tabs';

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  overflow: auto;
}
</style>
