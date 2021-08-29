<template>
  <v-app>
    <v-app-bar app>
      <img src="https://files.facepunch.com/s/c0444ba57c9a.svg" alt="Rust" width="112" height="28" class="mr-4" />
      <v-toolbar-title class="d-none d-sm-block">Crossbreeding Optimizer</v-toolbar-title>
      <v-toolbar-title class="d-sm-none">XO</v-toolbar-title>
      <div class="ml-auto">
        <AboutButton />
        <v-btn
          href="https://donorbox.org/rust-crossbreeding-optimizer?default_interval=o"
          target="_blank"
          class="teal darken-2 ml-2"
          >Donate</v-btn
        >
      </div>
    </v-app-bar>
    <v-main>
      <CrossbreedingSimulator />
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import CrossbreedingSimulator from './components/CrossbreedingSimulator.vue';
import AboutButton from './components/AboutButton.vue';

@Component({
  components: {
    CrossbreedingSimulator,
    AboutButton
  }
})
export default class App extends Vue {}
</script>

<style lang="scss">
body {
  overflow: hidden;
}
</style>
