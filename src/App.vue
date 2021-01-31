<template>
  <v-app>
    <v-app-bar app>
      <img src="https://files.facepunch.com/s/c0444ba57c9a.svg" alt="Rust" width="112" height="28" class="mr-4" />
      <v-toolbar-title>Crossbreeding Optimizer</v-toolbar-title>
    </v-app-bar>
    <v-main>
      <CrossbreedingSimulator />
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import CrossbreedingSimulator from './components/CrossbreedingSimulator.vue';

@Component({
  components: {
    CrossbreedingSimulator
  }
})
export default class App extends Vue {}
</script>

<style lang="scss"></style>
