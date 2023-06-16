<template>
  <v-app>
    <v-app-bar app>
      <LogoSelector @plant-type-change="handlePlantTypeChange"></LogoSelector>
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
        :selectedPlantTypeName="selectedPlantTypeName"
        :cookiesAccepted="cookiesAccepted"
        @estimated-time-updated="handleEstimatedTimeUpdated"
      />
      <InfoButtons class="d-flex justify-center d-xs-flex d-sm-none mb-3 flex-wrap" />
    </v-main>
    <CookieConsent v-on:cookies-accepted="handleCookiesAccepted" />
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import CrossbreedingSimulator from './components/CrossbreedingSimulator.vue';
import InfoButtons from './components/InfoButtons.vue';
import CookieConsent from './components/CookieConsent.vue';
import LogoSelector from './components/LogoSelector.vue';
import 'cookie-store';
import { timeMsToTimeString } from './lib/time-utils';

@Component({
  components: {
    LogoSelector,
    CrossbreedingSimulator,
    InfoButtons,
    CookieConsent
  }
})
export default class App extends Vue {
  cookiesAccepted = false;
  selectedPlantTypeName: string | null = null;
  estimatedTime: number | null = null;

  get calcEstimatedTime() {
    if (this.estimatedTime) {
      return timeMsToTimeString(this.estimatedTime);
    }
    return null;
  }

  handleCookiesAccepted() {
    this.cookiesAccepted = true;
    // eslint-disable-next-line no-undef
    enableGtag();
  }

  handlePlantTypeChange(name: string) {
    this.selectedPlantTypeName = name;
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
