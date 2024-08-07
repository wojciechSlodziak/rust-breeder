<template>
  <div class="simulator">
    <div class="simulator_calc-time mr-1" v-if="calcTotalTime">time: {{ calcTotalTime }}</div>
    <span class="app_version mr-1" v-if="!isSimulating && !calcTotalTime">v{{ appVersion }}</span>
    <ProgressIndicator :is-active="isSimulating" :progress-percents="progressPercents"></ProgressIndicator>
    <main
      class="simulator_container"
      :class="{
        'simulator_container--with-results': showResultsPanel
      }"
    >
      <div>
        <div class="simulator_controls pa-0">
          <div class="d-flex flex-wrap justify-center pt-6 pb-3 px-3">
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
            <v-tooltip top open-delay="250" z-index="1001" max-width="600" bottom>
              <template v-slot:activator="{ on }">
                <div v-on="on">
                  <v-btn
                    class="ma-1"
                    color="orange"
                    v-if="isSimulating && numberOfGenerations > 1"
                    :disabled="isCalculatingLastGeneration || !hasProgressStartedOnCurrentGeneration"
                    @click="handleSkipClick"
                    >Skip
                    <v-icon right>
                      mdi-skip-next
                    </v-icon></v-btn
                  >
                </div>
              </template>
              <span
                >Lets you skip to calculating results for the next generation without checking all the possible
                combinations for the current one. Can be a time saver but also might end up missing some crossbreeding
                results.
              </span>
            </v-tooltip>
            <SaplingScreenCapture
              @sapling-scanned="handleSaplingScannedEvent"
              :is-hidden="isSimulating && numberOfGenerations > 1"
              :is-disabled="isSimulating"
              @started-scanning="isScreenScanning = true"
              @stopped-scanning="isScreenScanning = false"
              :skip-scanner-guide="options ? options.skipScannerGuide : false"
            />
            <span class="ma-1">
              <Options
                ref="options"
                :functional-cookies-accepted="functionalCookiesAccepted"
                @options-set="handleOptionsSetEvent"
              />
            </span>
          </div>
          <GeneInputs
            class="simulator_sapling-input-container mx-3"
            ref="geneInputs"
            @validity-change="handleInputsValidityChange"
            :functional-cookies-accepted="functionalCookiesAccepted"
            :highlighted-map="highlightedMap"
            :disabled="isScreenScanning || isSimulating"
            :sounds-enabled="options ? options.sounds : false"
            :auto-save-input-sets="options ? options.autoSaveInputSets : false"
            :selected-plant-type-name="selectedPlantTypeName"
          ></GeneInputs>
        </div>

        <ads class="simulator_ads" :advertisement-cookies-accepted="advertisementCookiesAccepted"></ads>
      </div>

      <div>
        <div class="simulator_highlight my-6" ref="highlightedMap" v-if="showHighlight">
          <HighlightedMap
            :map="highlightedMap"
            @clear-highlight-clicked="handleClearHighlightClick"
            @composing-sapling-selected="handleHighlightComposingSaplingSelectedEvent"
          ></HighlightedMap>
        </div>

        <div
          ref="results"
          v-if="showResultsPanel"
          class="simulator_results pa-0 pa-md-3"
          :class="{ 'simulation_results--separated': showHighlight }"
        >
          <SimulationResults
            ref="simulationResults"
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
        </div>
      </div>
    </main>

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
      <template v-if="shouldDisplayGenInfoOnMapBrowser || shouldDisplayGeoInfoOnMapBrowser" v-slot:message>
        <template v-if="shouldDisplayGenInfoOnMapBrowser">
          The Sapling you selected comes from the <strong>2nd</strong> generation. You will need to crossbreed the
          Saplings that it requires first. Click on <span class="simulator_highlight-guide">highlighted</span> Saplings
          to see how to crossbreed them.
        </template>
        <v-divider
          class="mt-2 mb-2"
          v-if="shouldDisplayGenInfoOnMapBrowser && shouldDisplayGeoInfoOnMapBrowser"
        ></v-divider>
        <template v-if="shouldDisplayGeoInfoOnMapBrowser">
          Place plants with an "E" next to the <v-icon size="large" color="white">mdi-compass-rose</v-icon> icon in the
          eastern most slots of the planter box, and plants with a "W" in the western most slots to influence the
          crossbreeding for the desired result.
        </template>
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
  GeneticsMapGroup,
  SimulatorEventType
} from '@/services/crossbreeding-service/models';
import Sapling from '@/models/sapling.model';
import goTo from 'vuetify/lib/services/goto';
import Ads from './Ads.vue';
import ProgressIndicator from './ProgressIndicator.vue';
import SimulationMapGroup from './SimulationMapGroup.vue';
import SimulationMapGroupBrowser from './SimulationMapGroupBrowser.vue';
import ApplicationOptions from '@/interfaces/application-options';
import { timeMsToTimeString } from '@/lib/time-utils';
import HighlightedMap from './HighlightedMap.vue';

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
    Ads,
    HighlightedMap
  }
})
export default class CrossbreedingSimulator extends Vue {
  @Prop({ type: Boolean }) readonly functionalCookiesAccepted: boolean;
  @Prop({ type: Boolean }) readonly advertisementCookiesAccepted: boolean;
  @Prop({ type: String }) readonly selectedPlantTypeName: string;
  progressPercents: number[] = [];
  isSimulating = false;
  showResultsPanel = false;
  lastEstimatedTimeUpdateTimestamp = new Date().getTime();
  numberOfGenerations = 0;
  currentGenerationIndex = 1;
  areInputsValid = false;
  calcStartTime: number | null = null;
  calcEndTime: number | null = null;
  options: ApplicationOptions | null = null;
  highlightedMap: GeneticsMap | null = null;
  selectedBrowsingGroup: GeneticsMapGroup | null = null;
  isSelectedBrowsingGroupFromHighlight = false;
  selectedBrowsingGroup2: GeneticsMapGroup | null = null;
  resultMapGroups: ReadonlyArray<GeneticsMapGroup> | null = null;
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

  get shouldDisplayGenInfoOnMapBrowser() {
    return (
      this.isSelectedBrowsingGroupFromHighlight &&
      this.selectedBrowsingGroup &&
      !this.selectedBrowsingGroup2 &&
      this.selectedBrowsingGroup.mapList[0].resultSapling.generationIndex > 1
    );
  }

  get shouldDisplayGeoInfoOnMapBrowser() {
    const shouldGroupDisplayGeoInfo = (grp: GeneticsMapGroup | null) =>
      grp && (grp.mapList[0]?.chance < 1 || grp.mapList[1]?.chance < 1 || grp.mapList[2]?.chance < 1);
    return (
      shouldGroupDisplayGeoInfo(this.selectedBrowsingGroup) || shouldGroupDisplayGeoInfo(this.selectedBrowsingGroup2)
    );
  }

  get isCalculatingLastGeneration() {
    return this.isSimulating && this.currentGenerationIndex === this.options?.numberOfGenerations;
  }

  get hasProgressStartedOnCurrentGeneration() {
    return this.progressPercents[this.currentGenerationIndex - 1] !== undefined;
  }

  constructor() {
    super();
    crossbreedingOrchestrator.addEventListener(this.onCrossbreedingServiceEvent);
  }

  mounted() {
    this.options = (this.$refs.options as Options).getOptions();
  }

  onCrossbreedingServiceEvent(type: string, data: CrossbreedingOrchestratorEventListenerCallbackData) {
    if (type === SimulatorEventType.PROGRESS_UPDATE) {
      this.setProgress(data.generationIndex, data.progressPercent || 0);
      if (data.estimatedTimeMs) {
        this.updateEstimatedTime(data.estimatedTimeMs);
      }
    } else if (type === SimulatorEventType.PARTIAL_RESULTS || type === SimulatorEventType.DONE_GENERATION) {
      const hadNoResultsBefore = this.resultMapGroups === null;
      if (hadNoResultsBefore) {
        this.showResultsPanel = true;
        this.scrollToResults();
      }
      if (type === SimulatorEventType.PARTIAL_RESULTS) {
        this.setData(data.mapGroups as GeneticsMapGroup[], false);
      }
      if (type === SimulatorEventType.DONE_GENERATION) {
        this.setData(data.mapGroups as GeneticsMapGroup[], data.generationIndex === this.numberOfGenerations);
        this.setProgress(data.generationIndex, 100);
        this.currentGenerationIndex += 1;
        this.updateEstimatedTime(null);
      }
    } else if (type === SimulatorEventType.DONE) {
      this.calcEndTime = Date.now();
      this.updateEstimatedTime(null);
      this.updateTitle();

      setTimeout(() => {
        this.isSimulating = false;
      }, 200);
    }
  }

  setData(mapGroups: GeneticsMapGroup[], isFinalResult: boolean) {
    // For displaying partial results cloning is required to prevent Vue from constantly observing the results.
    this.resultMapGroups = Object.freeze(isFinalResult ? mapGroups : mapGroups.map((mapGroup) => mapGroup.clone()));
  }

  setProgress(generationIndex: number, progressPercent: number) {
    const generationProgressIndex = generationIndex - 1;
    // To decrease the number of updates on the UI we only update on change of the most significant decimal place.
    const progressPercentWithOneDecimal = Number(progressPercent.toFixed(1));
    if (this.progressPercents[generationProgressIndex] !== progressPercentWithOneDecimal) {
      this.onNextTickRerender(() => {
        Vue.set(this.progressPercents, generationProgressIndex, progressPercentWithOneDecimal);
      });
    }
    const progressPercentWithNoDecimals = Math.round(progressPercent || 0);
    this.updateTitle(generationIndex, progressPercentWithNoDecimals);
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
      (this.$refs.simulationResults as SimulationResults)?.resetPage();
      this.numberOfGenerations = this.options.numberOfGenerations;
      this.progressPercents = new Array(this.options.numberOfGenerations);
      this.currentGenerationIndex = 1;
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

  handleSkipClick() {
    crossbreedingOrchestrator.skipToNextGeneration();
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
      goTo(this.$refs.highlightedMap as HTMLElement, { duration: 200, appOffset: true, offset: 64 });
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
      goTo(this.$refs.results as HTMLElement, { duration: 300, offset: 64 });
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
.simulation_results--separated > div {
  border-top: 3px solid #b8b8b8;
  padding-top: 30px;
}

.simulator_container {
  max-width: 480px;
  margin: auto;
}
@media (min-width: 1040px) {
  .simulator_container.simulator_container--with-results {
    max-width: 100%;
    display: grid;
    grid-template-columns: 480px minmax(540px, 1fr);
  }
}
</style>
