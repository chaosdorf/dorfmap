<template>
  <div :class="$style.wrap">
    <a :class="$style.link" href="https://github.com/chaosdorf/dorfmap"
      >dorfmap</a
    >
    |
    <a :class="$style.link" href="https://wiki.chaosdorf.de/Lichtsteuerung"
      >about</a
    >
    |
    <a :class="$style.link" href="https://wiki.chaosdorf.de/Lichtsteuerung#API"
      >API</a
    >
    |
    <a :class="$style.link" href="/space_api.json">spaceApi</a>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class AboutHeader extends Vue {}
</script>

<style module>
.wrap {
  position: fixed;
  top: 5px;
  right: 15px;
  font-family: monospace;
  font-size: smaller;
}
.link {
  color: #006;
  text-decoration: none;
  margin: 5px;
}
</style>
