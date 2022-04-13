<template>
  <v-app>
    <v-app-bar app>
      <img src="https://files.facepunch.com/s/c0444ba57c9a.svg" alt="Rust" width="112" height="28" class="mr-4" />
      <v-toolbar-title>Breeder</v-toolbar-title>
      <InfoButtons class="ml-auto d-none d-sm-flex" />
    </v-app-bar>
    <v-main>
      <CrossbreedingSimulator />
      <InfoButtons class="d-flex justify-center d-xs-flex d-sm-none mb-3" />
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import CrossbreedingSimulator from './components/CrossbreedingSimulator.vue';
import InfoButtons from './components/InfoButtons.vue';

@Component({
  components: {
    CrossbreedingSimulator,
    InfoButtons
  }
})
export default class App extends Vue {}
</script>

<style lang="scss">
body {
  overflow: hidden;
}
</style>
