<template>
  <v-dialog v-model="isDialogOpen" width="500" overlay-opacity="0.85">
    <template v-slot:activator="{ on, attrs }">
      <v-btn v-bind="attrs" v-on="on" class="ma-1">
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
            I made it, because crossbreeding every wipe without an app was exhausting.
          </p>
          <p>
            If you have some feedback or need help, you can reach me on my
            <a target="_blank" href="https://discord.gg/Va5475pqFw">Discord</a> server.
          </p>
          <p>
            I am planning to maintain and improve this app in the future.
          </p>
          <p>
            If you want to appreciate my work and help me pay for the hosting, you can
            <a target="_blank" href="https://donorbox.org/rust-crossbreeding-optimizer?default_interval=o">donate</a>.
          </p>
          <p>Rust Breeder is not affilated with Facepunch.</p>
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
