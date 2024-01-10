<template>
  <div class="gene-inputs">
    <div class="gene-inputs_tabs-container">
      <v-tabs v-model="tab">
        <v-tab>{{ functionalCookiesAccepted ? 'Current' : 'Genes' }}</v-tab>
        <v-tab v-if="functionalCookiesAccepted" :class="{ 'gene-inputs_tab--animate': animatePreviousGenesTabIn }"
          >Saved</v-tab
        >
      </v-tabs>
      <v-btn
        :tile="!$vuetify.breakpoint.xsOnly"
        :icon="$vuetify.breakpoint.xsOnly"
        :disabled="!isFormValid"
        v-if="functionalCookiesAccepted && !autoSaveInputSets && tab !== 1"
        class="gene-inputs_store-button"
        plain
        @click="handleStoreSetClick"
      >
        <v-icon :left="!$vuetify.breakpoint.xsOnly" :class="{ 'mr-1': !$vuetify.breakpoint.xsOnly }">
          mdi-plus
        </v-icon>
        <span v-if="!$vuetify.breakpoint.xsOnly">Save</span>
      </v-btn>
    </div>

    <v-tabs-items v-model="tab">
      <v-tab-item>
        <v-form ref="form" v-model="isFormValid" spellcheck="false">
          <SaplingInputHighlights :input-string="saplingGenes" :highlighted-map="highlightedMap" />
          <SaplingListNumbering :sapling-gene-list="saplingGeneList"></SaplingListNumbering>
          <v-textarea
            full-width
            ref="saplingGenesInput"
            class="gene-inputs_input"
            :placeholder="placeholder"
            label="Add your genes here..."
            :value="saplingGenes"
            @input="handleSaplingGenesInput($event)"
            @blur="handleSaplingGenesInputBlur"
            @focus="handleSaplingGenesInputFocus"
            @keydown="handleSaplingGenesInputKeyDown($event)"
            outlined
            no-resize
            :disabled="disabled"
            :rows="Math.max(5, saplingGenes.split(`\n`).length || 0)"
            :rules="sourceSaplingRules"
            autocomplete="off"
          ></v-textarea>
          <SaplingListPreview
            :sapling-gene-list="saplingGeneList"
            ref="saplingListPreview"
            :highlight-errors="highlightInputErrors"
          ></SaplingListPreview>
        </v-form>
      </v-tab-item>
      <v-tab-item eager v-if="functionalCookiesAccepted">
        <PreviousGenes
          ref="previousGenes"
          :selected-plant-type-name="selectedPlantTypeName"
          @genes-selected="handlePreviousGenesSelectedEvent"
        ></PreviousGenes>
      </v-tab-item>
    </v-tabs-items>
  </div>
</template>

<script lang="ts">
import SaplingInputHighlights from './SaplingInputHighlights.vue';
import SaplingListPreview from './SaplingListPreview.vue';
import SaplingListNumbering from './SaplingListNumbering.vue';
import PreviousGenes from './PreviousGenes.vue';

import { Component, Prop, Vue } from 'vue-property-decorator';
import { GeneticsMap } from '@/services/crossbreeding-service/models';
import { playAudio } from '@/lib/ui-utils';
import StoredSet from '@/interfaces/stored-set';
import eventBus, { GLOBAL_EVENT_SELECTED_PLANT_TYPE_CHANGED } from '@/lib/global-event-bus';

@Component({
  components: {
    SaplingInputHighlights,
    SaplingListPreview,
    SaplingListNumbering,
    PreviousGenes
  }
})
export default class GeneInputs extends Vue {
  @Prop({ type: Boolean }) readonly functionalCookiesAccepted: boolean;
  @Prop({ type: Boolean }) readonly disabled: boolean;
  @Prop({ type: Boolean }) readonly soundsEnabled: boolean;
  @Prop({ type: Boolean }) readonly autoSaveInputSets: boolean;
  @Prop({ type: String }) readonly selectedPlantTypeName: string;
  @Prop({ type: GeneticsMap, required: false }) readonly highlightedMap: GeneticsMap | null;

  // fix for Safari not respecting new line in placeholder
  placeholder = `YGXWHH\nXWHYYG\nGHGWYY\netc...`.replaceAll('\n', ' '.repeat(100));
  saplingGenes = ``;
  isFormValid = false;
  isInputFocused = false;
  animatePreviousGenesTabIn = false;
  wasLastInputLongTimeAgo = false;
  lastInputTimeStamp = null;
  lastInputLongAgoTimeoutRef: undefined | NodeJS.Timeout;
  tab = 0;

  sourceSaplingRules = [
    (v: string) =>
      /^([GHWYX]{6}\n{1})*([GHWYX]{6}\n{0})*\n*$/.test(v) ||
      'The list of genes is incomplete or invalid. Review if you provided them all correctly.',
    (v: string) => v !== '' || 'Give me some genes to work with!',
    (v: string) => !/^([GHWYX]{6}\n{0})*\n*$/.test(v) || 'Give me some more genes to work with!'
  ];

  get saplingGeneList() {
    return this.saplingGenes === '' ? [] : this.saplingGenes.trim().split(/\r?\n/);
  }

  get highlightInputErrors() {
    return this.wasLastInputLongTimeAgo || !this.isInputFocused;
  }

  mounted() {
    const searchParams = new URLSearchParams(window.location.search);
    const genesUrlParam = searchParams.get('genes');
    if (genesUrlParam) {
      this.saplingGenes = genesUrlParam.split(',').join('\n');
    }

    if (this.saplingGenes !== '') {
      this.checkFormValidity();
    }
  }

  handleSaplingGenesInput(value: string) {
    this.prepareCheckForDatedInputActivity();
    const textarea = (this.$refs.saplingGenesInput as Vue).$el.querySelector('textarea');
    if (textarea) {
      const caretPosition = textarea.selectionStart;
      this.saplingGenes = value;
      this.onNextTickRerender(() => {
        this.saplingGenes = value.toUpperCase().replace(/[^GHWYX\n]/g, '');
        if (this.saplingGenes.length !== 0 && this.saplingGenes.charAt(0).match(/\r?\n/)) {
          this.saplingGenes = this.saplingGenes.slice(1);
        }
        this.checkFormValidity();
        this.onNextTickRerender(() => {
          textarea.selectionEnd = caretPosition + (this.saplingGenes.length - value.length);
        });
      });
    }
  }

  prepareCheckForDatedInputActivity() {
    this.wasLastInputLongTimeAgo = false;
    clearTimeout(this.lastInputLongAgoTimeoutRef);
    this.lastInputLongAgoTimeoutRef = setTimeout(() => {
      this.wasLastInputLongTimeAgo = true;
    }, 2000);
  }

  handleSaplingGenesInputFocus() {
    this.isInputFocused = true;
    this.prepareCheckForDatedInputActivity();
  }

  handleSaplingGenesInputBlur() {
    this.isInputFocused = false;
    this.saplingGenes = this.saplingGenes.replaceAll(/[\n]{2,}/g, '\n');
    this.saplingGenes = this.getDeduplicatedSaplingGeneList().join('\n');
    this.checkFormValidity();
  }

  handleStoreSetClick() {
    this.storeCurrentSet();
  }

  checkFormValidity() {
    this.onNextTickRerender(() => {
      if ((this.$refs.form as Vue & { validate: () => boolean }).validate()) {
        (this.$refs.form as Vue & { resetValidation: () => boolean }).resetValidation();
      }
      this.$emit('validity-change', this.isFormValid);
    });
  }

  handleSaplingScannedEvent(value: string) {
    if (this.saplingGenes.indexOf(value) === -1) {
      if (!this.saplingGenes.charAt(this.saplingGenes.length - 1).match(/\r?\n/) && this.saplingGenes.length !== 0) {
        this.saplingGenes += '\n';
      }
      this.saplingGenes += value;
      this.animateAndScrollToLastSapling();
      this.playSaplingsScannedSound();
      this.checkFormValidity();
    }
  }

  handlePreviousGenesSelectedEvent(set: StoredSet) {
    this.saplingGenes = set.genes;
    eventBus.$emit(GLOBAL_EVENT_SELECTED_PLANT_TYPE_CHANGED, set.selectedPlantTypeName);
    this.tab = 0;
    this.checkFormValidity();
    this.focusTextArea();
  }

  focusTextArea() {
    this.onNextTickRerender(() => {
      const textArea = (this.$refs.saplingGenesInput as Vue).$refs?.input as HTMLTextAreaElement;
      textArea.focus();
      textArea.setSelectionRange(textArea.value.length, textArea.value.length);
    });
  }

  storeCurrentSet() {
    const previousGenesComponent = this.$refs.previousGenes as PreviousGenes;
    if (previousGenesComponent) {
      const wasAdded = previousGenesComponent.addNewSet(this.saplingGenes);
      if (wasAdded) {
        this.animatePreviousGenesTab();
      }
    }
  }

  animatePreviousGenesTab() {
    this.animatePreviousGenesTabIn = true;
    setTimeout(() => {
      this.animatePreviousGenesTabIn = false;
    }, 700);
  }

  getDeduplicatedSaplingGeneList() {
    const splitSaplingGenes: string[] = this.saplingGeneList;
    const deduplicatedSaplingGenes: string[] = splitSaplingGenes.filter(
      (genes, index, self) => index === self.findIndex((otherGenes) => otherGenes === genes)
    );
    return deduplicatedSaplingGenes;
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
      'Control',
      'Tab'
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

  animateAndScrollToLastSapling() {
    (this.$refs.saplingListPreview as SaplingListPreview)?.animateAndScrollToLastSapling();
  }

  playSaplingsScannedSound() {
    if (this.soundsEnabled) {
      playAudio('saplingScannedAudio', 0.5);
    }
  }

  playWrongKeySound() {
    if (this.soundsEnabled) {
      playAudio('wrongKeyAudio', 0.04);
    }
  }
}
</script>

<style scoped lang="scss">
.gene-inputs_input {
  z-index: 1;
}
.gene-inputs_tabs-container {
  position: relative;
  .gene-inputs_store-button {
    position: absolute;
    right: 0;
    top: 0;
  }
  .gene-inputs_tab--animate {
    animation: highlight-tab 0.7s ease-in;
  }
}
.v-tabs-items {
  background-color: transparent;
}

@keyframes highlight-tab {
  0%,
  25%,
  100% {
    transform: scale(1);
  }

  15%,
  35%,
  80% {
    transform: scale(1.15);
    color: var(--v-primary-base);
  }
}
</style>

<style lang="scss">
.gene-inputs .v-tabs-bar {
  height: 36px;
  background-color: transparent !important;
}
.gene-inputs .v-input__control {
  border-radius: 0;
}
</style>
