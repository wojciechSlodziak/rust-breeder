<template>
  <v-dialog v-model="isDialogOpen" width="500">
    <template v-slot:activator="{ on, attrs }">
      <v-btn v-bind="attrs" v-on="on">
        About
      </v-btn>
    </template>

    <v-card>
      <v-card-title class="headline" primary-title>
        <h3>About</h3>
      </v-card-title>

      <v-card-text>
        <article class="mt-2">
          <p>Hi. I hope you're enjoying the app :).</p>
          <p>
            I made it, because I prefer to make my brain hurt once than multiple times, and crossbreeding every wipe
            without an app was exhausting.
          </p>
          <p>
            I also like to have some fun with fancy Front-End
            <a target="_blank" href="https://vuetifyjs.com/en/">frameworks</a>.
          </p>
          <p class="mb-0">
            If you have some feedback you can reach me on:
          </p>
          <ul>
            <li>Discord - <strong>Diff#0911</strong></li>
            <li>Reddit - <a target="_blank" href="https://www.reddit.com/user/Diffrnt">/user/Diffrnt</a></li>
          </ul>
          <p class="mt-3">
            I am planning to maintain and improve this app in future.
          </p>
          <p class="mb-0">
            If you want to appreciate my work and help me pay for the hosting you can
            <a target="_blank" href="https://donorbox.org/rust-crossbreeding-optimizer?default_interval=o">donate</a>.
          </p>
        </article>
      </v-card-text>
      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" text @click="closeDialog">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class AboutButton extends Vue {
  isDialogOpen = false;

  closeDialog() {
    this.isDialogOpen = false;
  }
}
</script>
