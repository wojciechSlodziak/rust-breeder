<template>
  <div>
    <AboutButton />
    <v-btn href="https://discord.gg/Va5475pqFw" target="_blank" class="indigo accent-2 white--text ma-1"
      >Discord
      <v-icon right>
        mdi-discord
      </v-icon>
    </v-btn>
    <v-btn
      href="https://donorbox.org/rust-crossbreeding-optimizer?default_interval=o"
      target="_blank"
      class="primary white--text ma-1"
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
