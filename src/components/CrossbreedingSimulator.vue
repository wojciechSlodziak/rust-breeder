<template>
  <div class="simulator">
    <ProgressIndicator :is-active="isSimulating" :progress-percents="progressPercents"></ProgressIndicator>
    <div class="simulator_calc-time mr-2" v-if="calcTime">time: {{ calcTime }}</div>
    <v-container fluid>
      <v-row>
        <v-col cols="12" :md="showHighlight ? 12 : 4" :lg="showHighlight ? 6 : 3" class="pa-1">
          <v-form ref="form" v-model="isFormValid" spellcheck="false">
            <v-row class="d-flex justify-center mt-2 px-3">
              <v-btn
                class="ma-1"
                color="primary"
                @click="handleSimulateClick"
                v-if="!isSimulating"
                :disabled="!isFormValid || isScreenScanning"
                >Calculate
              </v-btn>
              <v-btn class="ma-1" color="red" v-if="isSimulating" @click="handleStopSimulationClick"
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
                />
              </span>
              <span class="ma-1">
                <OptionsButton ref="optionsButton" />
              </span>
            </v-row>
            <v-row class="d-flex mx-1 pt-3 pb-3 mt-5">
              <div class="flex-grow-1 mx-3 simulator_sapling-input-container">
                <v-textarea
                  full-width
                  ref="saplingGenesInput"
                  class="simulator_sapling-input"
                  :placeholder="placeholder"
                  label="Add your genes here..."
                  :value="saplingGenes"
                  @input="handleSaplingGenesInput($event)"
                  @blur="handleSaplingGenesInputBlur"
                  @keydown="handleSaplingGenesInputKeyDown($event)"
                  outlined
                  :disabled="isScreenScanning || isSimulating"
                  auto-grow
                  :rules="sourceSaplingRules"
                  autocomplete="off"
                ></v-textarea>
                <SaplingInputHighlights :inputString="saplingGenes" :highlightedMap="highlightedMap" />
                <SaplingListPreview :saplingGeneList="saplingGeneList" ref="saplingListPreview"></SaplingListPreview>
              </div>

              <div v-if="showHighlight" class="d-flex flex-column align-center" style="flex: 1 0 0">
                <SimulationMap
                  :map="highlightedMap"
                  enable-composing-saplings-selection
                  @composing-sapling-selected="handleYoungestComposingSaplingSelectedEvent"
                />
                <v-btn class="mt-3" @click="handleClearHighlightClick">Clear Selection</v-btn>
                <div class="mt-2" v-if="highlightedMap && highlightedMap.resultSapling.generationIndex > 1">
                  The Sapling you selected comes from the
                  <strong>{{ highlightedMap.resultSapling.generationIndex === 2 ? '2nd' : '3rd' }}</strong> generation.
                  You will need to crossbreed the Saplings that it requires first. Click on
                  <span class="simulator_highlight-guide">highlighted</span> Saplings to see how to crossbreed them.
                </div>
              </div>
            </v-row>
          </v-form>
        </v-col>
        <v-col class="mt-10" cols="12" :md="showHighlight ? 12 : 8" :lg="showHighlight ? 6 : 9">
          <SimulationResults
            v-if="resultMapGroups !== null && resultMapGroups.length !== 0"
            :mapGroups="resultMapGroups"
            :highlightedMap="highlightedMap"
            v-on:select:map="handleSelectMapEvent"
          />
          <div
            class="text-center py-md-6 mb-10"
            v-if="resultMapGroups !== null && resultMapGroups.length === 0 && !isSimulating"
          >
            You'll need to find more plants. Try to pick the <strong>good</strong> ones!
          </div>
          <div class="text-center py-md-6 mb-10" v-if="showNotEnoughSaplingsError">
            More plants are needed to crossbreed!
          </div>
        </v-col>
      </v-row>
    </v-container>
    <SimulationMapGroup
      key="youngestComposingingSaplingGroup"
      v-if="displayedYoungestComposingSaplingGroup && !displayedOldestComposingSaplingGroup"
      :group="displayedYoungestComposingSaplingGroup"
      group-browsing-mode
      enable-composing-saplings-selection
      @composing-sapling-selected="handleOldestComposingSaplingSelectedEvent"
      @close="handleYoungestGenerationSimulationMapGroupCloseEvent"
    >
      <template
        v-if="displayedYoungestComposingSaplingGroup.mapList[0].resultSapling.generationIndex > 1"
        v-slot:browsingMessage
      >
        The Sapling you selected comes from the <strong>2nd</strong> generation. You will need to crossbreed the
        Saplings that it requires first. Click on <span class="simulator_highlight-guide">highlighted</span> Saplings to
        see how to crossbreed them.
      </template>
    </SimulationMapGroup>

    <SimulationMapGroup
      key="oldestCrossbreedingSaplingGroup"
      v-if="displayedOldestComposingSaplingGroup"
      :group="displayedOldestComposingSaplingGroup"
      group-browsing-mode
      @close="handleOldestGenerationSimulationMapGroupCloseEvent"
    ></SimulationMapGroup>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import optimizerService from '../services/optimizer-service/optimizer.service';
import SimulationResults from './SimulationResults.vue';
import SimulationMap from './SimulationMap.vue';
import SaplingInputHighlights from './SaplingInputHighlights.vue';
import OptionsButton from './OptionsButton.vue';
import SaplingListPreview from './SaplingListPreview.vue';
import SaplingScreenCapture from './SaplingScreenCapture.vue';
import {
  GeneticsMap,
  OptimizerServiceEventListenerCallbackData,
  GeneticsMapGroup,
  NotEnoughSourceSaplingsError
} from '@/services/optimizer-service/models';
import Sapling from '@/models/sapling.model';
import goTo from 'vuetify/lib/services/goto';
import ProgressIndicator from './ProgressIndicator.vue';
import SimulationMapGroup from './SimulationMapGroup.vue';

@Component({
  components: {
    SimulationResults,
    SimulationMap,
    SaplingInputHighlights,
    OptionsButton,
    SaplingScreenCapture,
    SaplingListPreview,
    ProgressIndicator,
    SimulationMapGroup
  }
})
export default class CrossbreedingSimulator extends Vue {
  placeholder = `YGXWHH\nXWHYYG\nGHGWYY\netc...`;
  saplingGenes = ``;
  // saplingGenes = `XXYWGH
  // XHHWHG
  // XHYXGW
  // WHHXHH
  // HHGWGY
  // GGGXYH
  // WGGWYH
  // XHGHGH
  // WGGWGH
  // WGGWHW
  // YHYXYH
  // WGYWYH
  // XHGHGX
  // WGHWGH
  // XHGYXX
  // YWGHGH
  // GYGXHH
  // XGGXHX
  // XXYHHH
  // WYYGGH
  // YYGWGW`;
  progressPercents: number[] = [];
  isSimulating = false;
  isFormValid = false;
  numberOfGenerations: number;
  calcStartTime: number | null = null;
  calcEndTime: number | null = null;
  showNotEnoughSaplingsError = false;
  highlightedMap: GeneticsMap | null = null;
  displayedYoungestComposingSaplingGroup: GeneticsMapGroup | null = null;
  displayedOldestComposingSaplingGroup: GeneticsMapGroup | null = null;
  resultMapGroups: GeneticsMapGroup[] | null = null;
  isScreenScanning = false;

  sourceSaplingRules = [
    (v: string) => v !== '' || 'Give me some plants to work with!',
    (v: string) => /^([GHWYX]{6}\n{1})*([GHWYX]{6}\n{0})*\n*$/.test(v) || 'You are almost there...'
  ];

  get showHighlight() {
    return this.highlightedMap !== null;
  }

  get saplingGeneList() {
    return this.saplingGenes === '' ? [] : this.saplingGenes.trim().split(/\r?\n/);
  }

  get calcTime() {
    if (this.calcStartTime && this.calcEndTime) {
      const timeDiff = this.calcEndTime - this.calcStartTime;
      const minutes = Math.floor(timeDiff / 60000);
      const seconds = (timeDiff % 60000) / 1000;
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds.toFixed(0)}`;
    }
    return null;
  }

  constructor() {
    super();
    optimizerService.addEventListener(this.onOptimizerServiceEvent);
  }

  handleSaplingGenesInput(value: string) {
    this.showNotEnoughSaplingsError = false;
    const textarea = (this.$refs.saplingGenesInput as Vue).$el.querySelector('textarea');
    if (textarea) {
      const caretPosition = textarea.selectionStart;
      this.saplingGenes = value;
      this.$nextTick(() => {
        this.saplingGenes = value.toUpperCase().replace(/[^GHWYX\n]/g, '');
        if (this.saplingGenes.length !== 0 && this.saplingGenes.charAt(0).match(/\r?\n/)) {
          this.saplingGenes = this.saplingGenes.slice(1);
        }
        this.$nextTick(() => {
          textarea.selectionEnd = caretPosition + (this.saplingGenes.length - value.length);
        });
      });
    }
  }

  getDeduplicatedSaplingGeneList() {
    const splitSaplingGenes: string[] = this.saplingGeneList;
    const deduplicatedSaplingGenes: string[] = splitSaplingGenes.filter(
      (genes, index, self) => index === self.findIndex((otherGenes) => otherGenes === genes)
    );
    return deduplicatedSaplingGenes;
  }

  handleSaplingScannedEvent(value: string) {
    if (this.saplingGenes.indexOf(value) === -1) {
      if (!this.saplingGenes.charAt(this.saplingGenes.length - 1).match(/\r?\n/) && this.saplingGenes.length !== 0) {
        this.saplingGenes += '\n';
      }
      this.saplingGenes += value;
      (this.$refs.saplingListPreview as SaplingListPreview)?.animateLastSapling();
    }
  }

  onOptimizerServiceEvent(type: string, data: OptimizerServiceEventListenerCallbackData) {
    if (type === 'PROGRESS_UPDATE') {
      Vue.set(this.progressPercents, data.generationIndex - 1, data.progressPercent || 0);
    } else if (type === 'DONE_GENERATION') {
      this.setData(data.mapGroups as GeneticsMapGroup[], data.generationIndex === this.numberOfGenerations);
      Vue.set(this.progressPercents, data.generationIndex - 1, 100);
    } else if (type === 'DONE') {
      this.calcEndTime = Date.now();

      setTimeout(() => {
        this.isSimulating = false;
      }, 200);
    }
    this.$forceUpdate();
  }

  setData(mapGroups: GeneticsMapGroup[], isFinalResult: boolean) {
    // For partial results cloning for better performance is required to prevent Vue from constantly observing the results.
    this.resultMapGroups = isFinalResult ? mapGroups : mapGroups.map((mapGroup) => mapGroup.clone());
  }

  handleSimulateClick() {
    this.clearHighlight();
    const deduplicatedSaplingGeneList = this.getDeduplicatedSaplingGeneList();
    this.saplingGenes = deduplicatedSaplingGeneList.join('\n');

    const options = (this.$refs.optionsButton as OptionsButton).getOptions();

    this.numberOfGenerations = options.numberOfGenerations;
    this.progressPercents = new Array(options.numberOfGenerations);
    this.resultMapGroups = null;
    this.calcStartTime = Date.now();
    this.calcEndTime = null;
    try {
      optimizerService.simulateBestGenetics(
        deduplicatedSaplingGeneList.map((geneString) => new Sapling(geneString)),
        undefined,
        options
      );
      this.isSimulating = true;
    } catch (e) {
      if (e instanceof NotEnoughSourceSaplingsError) {
        this.showNotEnoughSaplingsError = true;
      } else {
        throw e;
      }
    }
  }

  handleStopSimulationClick() {
    this.isSimulating = false;
    optimizerService.cancelSimulation();
  }

  handleSaplingGenesInputBlur() {
    this.saplingGenes = this.saplingGenes.replaceAll(/[\n]{2,}/g, '\n');
    this.saplingGenes = this.getDeduplicatedSaplingGeneList().join('\n');
    this.$nextTick(() => {
      if ((this.$refs.form as Vue & { validate: () => boolean }).validate()) {
        (this.$refs.form as Vue & { resetValidation: () => boolean }).resetValidation();
      }
    });
  }

  handleSaplingGenesInputKeyDown(event: KeyboardEvent) {
    const allowedKeys = [
      'H',
      'G',
      'Y',
      'X',
      'W',
      'Enter',
      'Backspace',
      'ArrowRight',
      'ArrowLeft',
      'ArrowUp',
      'ArrowDown',
      'End',
      'Delete',
      'Home',
      'Shift',
      'Alt',
      'Control'
    ];
    if (
      event.key &&
      event.key !== 'Unidentified' &&
      !(event.altKey || event.ctrlKey) &&
      allowedKeys.indexOf(event.key) === -1 &&
      allowedKeys.indexOf(event.key.toUpperCase()) === -1
    ) {
      this.playWrongKeySound();
    }
  }

  handleYoungestComposingSaplingSelectedEvent(group: GeneticsMapGroup) {
    this.displayedYoungestComposingSaplingGroup = group;
  }

  handleOldestComposingSaplingSelectedEvent(group: GeneticsMapGroup) {
    this.displayedOldestComposingSaplingGroup = group;
  }

  handleYoungestGenerationSimulationMapGroupCloseEvent() {
    this.displayedYoungestComposingSaplingGroup = null;
  }

  handleOldestGenerationSimulationMapGroupCloseEvent() {
    this.displayedOldestComposingSaplingGroup = null;
  }

  handleClearHighlightClick() {
    this.clearHighlight();
  }

  clearHighlight() {
    this.highlightedMap = null;
  }

  playWrongKeySound() {
    const audioElement = document.getElementById('headshotAudio');
    if (audioElement) {
      const headshotAudio = audioElement.cloneNode() as HTMLElement & {
        volume: string;
        play: () => void;
      };
      if (headshotAudio) {
        headshotAudio.volume = '0.05';
        headshotAudio.play();
      }
    }
  }

  handleSelectMapEvent(map: GeneticsMap) {
    this.highlightedMap = map;
    goTo(0, { duration: 200 });
  }
}
</script>

<style scoped lang="scss">
.simulator_calc-time {
  position: absolute;
  right: 0;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
}
.simulator_sapling-input-container {
  position: relative;
  min-width: 260px;
  .simulator_sapling-input {
    z-index: 1;
  }
}
.simulator_highlight-guide {
  outline: 2px solid rgba(223, 145, 0, 0.3);
  outline-offset: 2px;
}
</style>
