<template>
  <v-app style="min-height: 100vh !important;">
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
        :selected-plant-type-name="selectedPlantTypeName"
        :functional-cookies-accepted="functionalCookiesAccepted"
        @estimated-time-updated="handleEstimatedTimeUpdated"
      />
      <InfoButtons class="d-flex justify-center d-xs-flex d-sm-none mb-3 flex-wrap" />
    </v-main>
    <CookieConsent @cookies-updated="handleCookiesUpdated" />
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import CrossbreedingSimulator from './components/CrossbreedingSimulator.vue';
import InfoButtons from './components/InfoButtons.vue';
import CookieConsent, { CookiesUpdateEvent } from './components/CookieConsent.vue';
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
  functionalCookiesAccepted = false;
  selectedPlantTypeName: string | null = null;
  estimatedTime: number | null = null;

  get calcEstimatedTime() {
    if (this.estimatedTime) {
      return timeMsToTimeString(this.estimatedTime);
    }
    return null;
  }

  mounted() {
    this.preventAdSenseFromAssigningHeightToContainer();
  }

  preventAdSenseFromAssigningHeightToContainer() {
    const container = document.getElementsByClassName('v-application--wrap')[0] as HTMLElement;
    const observer = new MutationObserver(function() {
      container.style.minHeight = '100vh';
    });
    observer.observe(container, {
      attributes: true,
      attributeFilter: ['style']
    });
  }

  handleCookiesUpdated(cookiesState: CookiesUpdateEvent) {
    this.functionalCookiesAccepted = cookiesState.functionalCookiesAccepted;

    if (cookiesState.analyticsCookiesAccepted) {
      // eslint-disable-next-line no-undef
      enableGtag();
    }
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
