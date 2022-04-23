<template>
  <v-app>
    <v-app-bar app>
      <a href="/" title="RustBreeder">
        <img
          src="https://files.facepunch.com/s/c0444ba57c9a.svg"
          alt="Rust Logo"
          width="112"
          height="28"
          class="mr-4"
        />
      </a>
      <v-toolbar-title>Breeder</v-toolbar-title>
      <InfoButtons class="ml-auto d-none d-sm-flex" />
    </v-app-bar>
    <v-main>
      <CrossbreedingSimulator />
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
  handleCookiesAccepted() {
    // eslint-disable-next-line no-undef
    enableGtag();
  }
}
</script>

<style lang="scss">
body {
  overflow: hidden;
}
</style>
