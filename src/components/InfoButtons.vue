<template>
  <div>
    <AboutButton />
    <v-btn href="https://discord.gg/Va5475pqFw" target="_blank" class="indigo accent-2 ml-2">Discord</v-btn>
    <v-btn
      href="https://donorbox.org/rust-crossbreeding-optimizer?default_interval=o"
      target="_blank"
      class="teal darken-2 ml-2"
      >Donate</v-btn
    >
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import AboutButton from './AboutButton.vue';

@Component({
  components: {
    AboutButton
  }
})
export default class InfoButtons extends Vue {}
</script>

<style scoped lang="scss"></style>
