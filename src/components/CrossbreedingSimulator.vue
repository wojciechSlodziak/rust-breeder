<template>
  <div class="simulator">
    <div class="simulator_calc-time mr-1" v-if="calcTotalTime">time: {{ calcTotalTime }}</div>
    <span class="app_version mr-1" v-if="!isSimulating && !calcTotalTime">v{{ appVersion }}</span>
    <ProgressIndicator :is-active="isSimulating" :progress-percents="progressPercents"></ProgressIndicator>
    <v-container fluid>
      <v-row class="justify-center">
        <v-col
          cols="12"
          :md="!hasResults ? 12 : showHighlight ? 12 : 4"
          :lg="!hasResults ? 12 : showHighlight ? 6 : 3"
          class="pa-0 simulator_controls"
          :class="{
            'simulator_controls--with-highlight': showHighlight
          }"
        >
          <div class="d-flex flex-wrap justify-center my-5 px-3">
            <v-btn
              class="ma-1"
              color="primary"
              @click="handleSimulateClick"
              v-if="!isSimulating"
              :disabled="!areInputsValid || isScreenScanning"
              >Calculate
            </v-btn>
            <v-btn class="ma-1 white--text" color="red" v-if="isSimulating" @click="handleStopSimulationClick"
              >Cancel
              <v-icon right>
                mdi-cancel
              </v-icon></v-btn
            >
            <span class="ma-1">
              <SaplingScreenCapture
                @sapling-scanned="handleSaplingScannedEvent"
                :is-disabled="isSimulating"
                @started-scanning="isScreenScanning = true"
                @stopped-scanning="isScreenScanning = false"
                :skip-scanner-guide="options ? options.skipScannerGuide : false"
              />
            </span>
            <span class="ma-1">
              <Options ref="options" :cookies-accepted="cookiesAccepted" @options-set="handleOptionsSetEvent" />
            </span>
          </div>
          <v-row no-gutters>
            <v-col>
              <GeneInputs
                class="simulator_sapling-input-container mx-3"
                ref="geneInputs"
                @validity-change="handleInputsValidityChange"
                :highlightedMap="highlightedMap"
                :disabled="isScreenScanning || isSimulating"
                :soundsEnabled="options ? options.sounds : false"
                :autoSaveInputSets="options ? options.autoSaveInputSets : false"
                :selectedPlantTypeName="selectedPlantTypeName"
              ></GeneInputs>
            </v-col>

            <v-col ref="highlightedMap" v-if="showHighlight" class="d-flex flex-column align-center mx-sm-3 mb-3">
              <SimulationMap
                :map="highlightedMap"
                enable-tooltip
                enable-composing-saplings-selection
                @composing-sapling-selected="handleHighlightComposingSaplingSelectedEvent"
              />
              <v-btn class="mt-3" @click="handleClearHighlightClick">Clear Selection</v-btn>
              <div
                class="mt-2 mb-2 px-3 px-sm-0"
                v-if="highlightedMap && highlightedMap.resultSapling.generationIndex > 1"
              >
                The Sapling you selected comes from the
                <strong>{{ highlightedMap.resultSapling.generationIndex === 2 ? '2nd' : '3rd' }}</strong> generation.
                You will first need to crossbreed Saplings that it requires. Click on
                <span class="simulator_highlight-guide">highlighted</span> Saplings to see how to crossbreed them.
              </div>
            </v-col>
          </v-row>
          <pine-hosting-ad></pine-hosting-ad>
        </v-col>
        <v-col
          ref="results"
          v-if="hasResults"
          class="pa-0 pa-md-3"
          cols="12"
          :md="showHighlight ? 12 : 8"
          :lg="showHighlight ? 6 : 9"
        >
          <SimulationResults
            :map-groups="resultMapGroups"
            :highlighted-map="highlightedMap"
            v-on:map-selected="handleMapSelectedEvent"
            v-on:group-selected="handleGroupSelectedEvent"
          />
          <div
            class="simulator_error-text text-center mt-5"
            v-if="resultMapGroups !== null && resultMapGroups.length === 0 && !isSimulating"
          >
            The genes that you provided did not return any useful results. You'll need to find more plants. Try to pick
            the <strong>good</strong> ones!
          </div>
        </v-col>
      </v-row>
    </v-container>
    <SimulationMapGroupBrowser
      :group="selectedBrowsingGroup"
      :group2="selectedBrowsingGroup2"
      :enable-map-selection="!isSelectedBrowsingGroupFromHighlight"
      :enable-composing-saplings-selection="isSelectedBrowsingGroupFromHighlight"
      :highlighted-map="highlightedMap"
      @map-selected="handleMapSelectedEvent"
      @composing-sapling-selected="handleBrowsingGroupComposingSaplingSelected"
      @leave-group-browsing="handleBrowserLeaveEvent"
    >
      <template
        v-if="
          isSelectedBrowsingGroupFromHighlight &&
            selectedBrowsingGroup &&
            !selectedBrowsingGroup2 &&
            selectedBrowsingGroup.mapList[0].resultSapling.generationIndex > 1
        "
        v-slot:message
      >
        The Sapling you selected comes from the <strong>2nd</strong> generation. You will need to crossbreed the
        Saplings that it requires first. Click on <span class="simulator_highlight-guide">highlighted</span> Saplings to
        see how to crossbreed them.
      </template>
    </SimulationMapGroupBrowser>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import crossbreedingOrchestrator from '../services/crossbreeding-service/crossbreeding-orchestrator';
import SimulationResults from './SimulationResults.vue';
import SimulationMap from './SimulationMap.vue';
import Options from './Options.vue';
import GeneInputs from './GeneInputs.vue';
import SaplingScreenCapture from './SaplingScreenCapture.vue';
import {
  GeneticsMap,
  CrossbreedingOrchestratorEventListenerCallbackData,
  GeneticsMapGroup
} from '@/services/crossbreeding-service/models';
import Sapling from '@/models/sapling.model';
import goTo from 'vuetify/lib/services/goto';
import PineHostingAd from './PineHostingAd.vue';
import ProgressIndicator from './ProgressIndicator.vue';
import SimulationMapGroup from './SimulationMapGroup.vue';
import SimulationMapGroupBrowser from './SimulationMapGroupBrowser.vue';
import ApplicationOptions from '@/interfaces/application-options';
import { timeMsToTimeString } from '@/lib/time-utils';

@Component({
  components: {
    SimulationResults,
    SimulationMap,
    Options,
    GeneInputs,
    SaplingScreenCapture,
    ProgressIndicator,
    SimulationMapGroup,
    SimulationMapGroupBrowser,
    PineHostingAd
  }
})
export default class CrossbreedingSimulator extends Vue {
  @Prop({ type: Boolean }) readonly cookiesAccepted: boolean;
  @Prop({ type: String }) readonly selectedPlantTypeName: string;
  progressPercents: number[] = [];
  isSimulating = false;
  hasResults = false;
  lastEstimatedTimeUpdateTimestamp = new Date().getTime();
  numberOfGenerations = 0;
  areInputsValid = false;
  calcStartTime: number | null = null;
  calcEndTime: number | null = null;
  options: ApplicationOptions | null = null;
  highlightedMap: GeneticsMap | null = null;
  selectedBrowsingGroup: GeneticsMapGroup | null = null;
  isSelectedBrowsingGroupFromHighlight = false;
  selectedBrowsingGroup2: GeneticsMapGroup | null = null;
  resultMapGroups: GeneticsMapGroup[] | null = null;
  isScreenScanning = false;
  appVersion = process.env.VUE_APP_VERSION;

  get showHighlight() {
    return this.highlightedMap !== null;
  }

  get calcTotalTime() {
    if (this.calcStartTime && this.calcEndTime) {
      const timeDiff = this.calcEndTime - this.calcStartTime;
      return timeMsToTimeString(timeDiff);
    }
    return null;
  }

  constructor() {
    super();
    crossbreedingOrchestrator.addEventListener(this.onCrossbreedingServiceEvent);
  }

  mounted() {
    this.options = (this.$refs.options as Options).getOptions();
  }

  onCrossbreedingServiceEvent(type: string, data: CrossbreedingOrchestratorEventListenerCallbackData) {
    if (type === 'PROGRESS_UPDATE') {
      this.setProgress(data.generationIndex, Math.round(data.progressPercent || 0));
      this.updateEstimatedTime(data.estimatedTimeMs);
    } else if (type === 'DONE_GENERATION') {
      if (data.generationIndex === 1) {
        this.hasResults = true;
        this.scrollToResults();
      }
      this.setData(data.mapGroups as GeneticsMapGroup[], data.generationIndex === this.numberOfGenerations);
      this.setProgress(data.generationIndex, 100);
    } else if (type === 'DONE') {
      this.calcEndTime = Date.now();
      this.updateEstimatedTime(null);

      setTimeout(() => {
        this.isSimulating = false;
      }, 200);
    }
  }

  setData(mapGroups: GeneticsMapGroup[], isFinalResult: boolean) {
    // For partial results cloning for better performance is required to prevent Vue from constantly observing the results.
    this.resultMapGroups = isFinalResult ? mapGroups : mapGroups.map((mapGroup) => mapGroup.clone());
  }

  setProgress(generationIndex: number, progressPercent: number) {
    const progress = Math.round(progressPercent || 0);
    const index = generationIndex - 1;
    if (this.progressPercents[index] !== progress) {
      this.onNextTickRerender(() => {
        Vue.set(this.progressPercents, index, progress);
      });
    }
    this.updateTitle(generationIndex, progressPercent);
  }

  updateTitle(generationIndex?: number | undefined, progressPercent?: number | undefined) {
    if (
      (progressPercent === 100 && generationIndex === this.options?.numberOfGenerations) ||
      generationIndex === undefined
    ) {
      document.title = 'Rust Breeder - Crossbreeding Optimizer';
    } else {
      document.title = `${progressPercent}% | GEN.${generationIndex}`;
    }
  }

  updateEstimatedTime(estimatedTime: number | null) {
    const currentTimestamp = new Date().getTime();
    if (!estimatedTime || currentTimestamp - this.lastEstimatedTimeUpdateTimestamp > 250) {
      this.$emit('estimated-time-updated', estimatedTime);
      this.lastEstimatedTimeUpdateTimestamp = currentTimestamp;
    }
  }

  handleSimulateClick() {
    if (this.options) {
      this.clearHighlight();
      const deduplicatedSaplingGeneList = (this.$refs.geneInputs as GeneInputs).getDeduplicatedSaplingGeneList();
      this.numberOfGenerations = this.options.numberOfGenerations;
      this.progressPercents = new Array(this.options.numberOfGenerations);
      this.resultMapGroups = null;
      this.calcStartTime = Date.now();
      this.calcEndTime = null;
      crossbreedingOrchestrator.simulateBestGenetics(
        deduplicatedSaplingGeneList.map((geneString, index) => new Sapling(geneString, 0, index)),
        undefined,
        this.options
      );
      this.isSimulating = true;

      if (this.options.autoSaveInputSets) {
        (this.$refs.geneInputs as GeneInputs).storeCurrentSet();
      }
    }
  }

  handleStopSimulationClick() {
    this.isSimulating = false;
    this.updateEstimatedTime(null);
    this.updateTitle();
    crossbreedingOrchestrator.cancelSimulation();
  }

  handleSaplingScannedEvent(value: string) {
    (this.$refs.geneInputs as GeneInputs).handleSaplingScannedEvent(value);
  }

  handleInputsValidityChange(valid: boolean) {
    this.areInputsValid = valid;
  }

  handleClearHighlightClick() {
    this.clearHighlight();
  }

  clearHighlight() {
    this.highlightedMap = null;
  }

  handleMapSelectedEvent(map: GeneticsMap) {
    this.highlightedMap = map;
    this.selectedBrowsingGroup = null;
    this.onNextTickRerender(() => {
      const rect = (this.$refs.highlightedMap as HTMLElement)?.getBoundingClientRect();
      const topDistance = rect.top + rect.height / 2 + window.scrollY - window.innerHeight / 2;
      goTo(topDistance, { duration: 200 });
    });
  }

  handleGroupSelectedEvent(group: GeneticsMapGroup) {
    this.isSelectedBrowsingGroupFromHighlight = false;
    this.selectedBrowsingGroup = group;
  }

  handleHighlightComposingSaplingSelectedEvent(group: GeneticsMapGroup) {
    this.isSelectedBrowsingGroupFromHighlight = true;
    this.selectedBrowsingGroup = group;
  }

  handleBrowsingGroupComposingSaplingSelected(group: GeneticsMapGroup) {
    this.selectedBrowsingGroup2 = group;
  }

  handleBrowserLeaveEvent() {
    if (this.selectedBrowsingGroup2) {
      this.selectedBrowsingGroup2 = null;
    } else {
      this.selectedBrowsingGroup = null;
    }
  }

  handleOptionsSetEvent(options: ApplicationOptions) {
    this.options = options;
  }

  scrollToResults() {
    setTimeout(() => {
      const rect = (this.$refs.results as HTMLElement)?.getBoundingClientRect();
      goTo(rect.top, { duration: 300 });
    }, 200);
  }
}
</script>

<style scoped lang="scss">
.simulator_calc-time,
.app_version {
  position: absolute;
  right: 0;
  font-size: 0.75rem;
  opacity: 0.5;
}
.simulator_controls:not(.simulator_controls--with-highlight) {
  max-width: 500px;
}
.simulator_sapling-input-container {
  position: relative;
  min-width: 260px;
}
.simulator_error-text {
  min-height: 600px;
}
.simulator_highlight-guide {
  outline: 2px solid rgba(223, 145, 0, 0.4);
  outline-offset: 2px;
}
</style>
