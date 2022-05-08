<template>
  <div class="simulator">
    <div class="simulator_progress-container">
      <v-progress-linear color="secondary" v-if="isSimulating" v-model="progressPercent" stream></v-progress-linear>
    </div>
    <v-container fluid>
      <v-row>
        <v-col cols="12" :md="showHighlight ? 12 : 4" :lg="showHighlight ? 5 : 3" class="pa-1">
          <v-form ref="form" v-model="isFormValid" spellcheck="false">
            <v-row class="d-flex justify-center mt-1">
              <v-btn color="primary" @click="handleSimulateClick" :disabled="isSimulating || !isFormValid"
                >Simulate</v-btn
              >
              <span class="ml-2">
                <OptionsButton ref="optionsButton" />
              </span>
            </v-row>

            <v-row class="d-flex mx-1 pt-3 pb-3">
              <div class="flex-grow-1 mx-3 simulator_sapling-input-container">
                <v-textarea
                  full-width
                  ref="saplingGenesInput"
                  class="simulator_sapling-input"
                  label="Source Saplings"
                  :value="saplingGenes"
                  @input="handleSaplingGenesInput($event)"
                  @blur="handleSaplingGenesInputBlur"
                  @keydown="handleSaplingGenesInputKeyDown($event)"
                  outlined
                  auto-grow
                  validate-on-blur
                  :rules="sourceSaplingRules"
                  autocomplete="off"
                  hint="Enter each Sapling's genes in new line using 'XXYWGH' format."
                ></v-textarea>
                <SaplingInputHighlights :inputString="saplingGenes" :highlightedMap="highlightedMap" />
              </div>

              <div v-if="showHighlight" class="d-flex flex-column align-center" style="flex: 1 0 0">
                <SimulationMap :map="highlightedMap" :isHighlight="true" />
                <v-btn class="mt-3" @click="handleClearHighlightClick">Clear</v-btn>
              </div>
            </v-row>
          </v-form>
        </v-col>

        <v-col cols="12" :md="showHighlight ? 12 : 8" :lg="showHighlight ? 7 : 9">
          <SimulationResults
            v-if="resultMapGroups !== null && resultMapGroups.length !== 0 && !isSimulating"
            :mapGroups="resultMapGroups"
            :highlightedMap="highlightedMap"
            v-on:select:map="handleSelectMapEvent"
          />
          <div
            class="text-center py-md-6"
            v-if="resultMapGroups !== null && resultMapGroups.length === 0 && !isSimulating"
          >
            No bueno! You'll need to find more source plants. Try to pick the <strong>good</strong> ones!
          </div>
          <div class="text-center py-md-6" v-if="showNotEnoughSaplingsError">
            No bueno! More plants are needed to crossbreed!
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import optimizerService from '../services/optimizer-service/optimizer.service';
import SimulationResults from './SimulationResults.vue';
import SimulationMap from './SimulationMap.vue';
import SaplingInputHighlights from './SaplingInputHighlights.vue';
import OptionsButton from './OptionsButton.vue';
import { EventListenerCallbackData, MapGroup, NotEnoughSourceSaplingsError } from '@/services/optimizer-service/models';
import GeneticsMap from '@/models/genetics-map.model';
import goTo from 'vuetify/lib/services/goto';

@Component({
  components: { SimulationResults, SimulationMap, SaplingInputHighlights, OptionsButton }
})
export default class CrossbreedingSimulator extends Vue {
  saplingGenes = 'YYYWYX\nGGHGHY\nHHGGGY';
  progressPercent = 0;
  isSimulating = false;
  isFormValid = false;
  showNotEnoughSaplingsError = false;
  highlightedMap: GeneticsMap | null = null;
  resultMapGroups: readonly MapGroup[] | null = null;

  sourceSaplingRules = [
    (v: string) => v !== '' || 'Give me some plants to work with!',
    (v: string) => /^([GHWYX]{6}\n{1})*([GHWYX]{6}\n{0})*\n*$/.test(v) || 'The format is wrong...'
  ];

  get showHighlight() {
    return this.highlightedMap !== null;
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
        this.$nextTick(() => {
          textarea.selectionEnd = caretPosition + (this.saplingGenes.length - value.length);
        });
      });
    }
  }

  onOptimizerServiceEvent(type: string, data: EventListenerCallbackData) {
    if (type === 'PROGRESS_UPDATE') {
      this.progressPercent = data.progressPercent || 0;
    }
    if (type === 'DONE') {
      this.progressPercent = 100;
      this.resultMapGroups = Object.freeze(data.mapGroups || null);

      setTimeout(() => {
        this.isSimulating = false;
        this.progressPercent = 0;
      }, 200);
    }
    this.$forceUpdate();
  }

  handleSimulateClick() {
    this.clearHighlight();
    const splitSaplingGenes: string[] = this.saplingGenes.trim().split(/\r?\n/);
    const deduplicatedSaplingGenes: string[] = splitSaplingGenes.filter(
      (genes, index, self) => index === self.findIndex((otherGenes) => otherGenes === genes)
    );
    this.saplingGenes = deduplicatedSaplingGenes.join('\n');

    this.progressPercent = 0;
    this.resultMapGroups = null;
    try {
      optimizerService.simulateBestGenetics(
        deduplicatedSaplingGenes,
        (this.$refs.optionsButton as OptionsButton).getOptions()
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

  handleSaplingGenesInputBlur() {
    this.saplingGenes = this.saplingGenes.replaceAll(/[\n]{2,}/g, '\n');
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
.simulator_progress-container {
  height: 5px;
}
.simulator_sapling-input-container {
  position: relative;
  .simulator_sapling-input {
    z-index: 1;
  }
}
</style>
