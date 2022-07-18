<template>
  <v-app>
    <v-app-bar app>
      <a href="/" title="RustBreeder" class="mr-4">
        <img
          src="https://files.facepunch.com/s/c0444ba57c9a.svg"
          alt="Rust Logo"
          width="112"
          height="28"
          class="d-block"
        />
      </a>
      <v-toolbar-title>Breeder</v-toolbar-title>
      <div class="d-flex align-center ml-auto">
        <div v-if="estimatedTime" class="mr-2 estimated-time">
          <v-icon small>
            mdi-timer-outline
          </v-icon>
          {{ calcEstimatedTime }}
        </div>
        <InfoButtons class="d-none d-sm-flex" />
      </div>
    </v-app-bar>
    <v-main>
      <CrossbreedingSimulator
        :cookies-accepted="cookiesAccepted"
        @estimated-time-updated="handleEstimatedTimeUpdated"
      />
      <InfoButtons class="d-flex justify-center d-xs-flex d-sm-none mb-3" />
    </v-main>
    <CookieConsent v-on:cookies-accepted="handleCookiesAccepted" />
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import CrossbreedingSimulator from './components/CrossbreedingSimulator.vue';
import InfoButtons from './components/InfoButtons.vue';
import CookieConsent from './components/CookieConsent.vue';
import 'cookie-store';

@Component({
  components: {
    CrossbreedingSimulator,
    InfoButtons,
    CookieConsent
  }
})
export default class App extends Vue {
  cookiesAccepted = false;
  estimatedTime: number | null = null;

  get calcEstimatedTime() {
    if (this.estimatedTime) {
      const minutes = Math.floor(this.estimatedTime / 60000);
      const seconds = Math.round((this.estimatedTime % 60000) / 1000);
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds.toFixed(0)}`;
    }
    return null;
  }

  handleCookiesAccepted() {
    this.cookiesAccepted = true;
    // eslint-disable-next-line no-undef
    enableGtag();
  }

  handleEstimatedTimeUpdated(value: number | null) {
    this.estimatedTime = value;
  }
}
</script>

<style lang="scss">
@import '~vuetify/src/styles/styles.sass';

body {
  overflow: hidden;
}
@media #{map-get($display-breakpoints, 'sm-and-down')} {
  .v-input__slider {
    .v-input__slot {
      display: block !important;
    }
  }
}
.v-input__slider {
  .v-messages__message {
    margin-top: 10px;
  }
}
</style>
