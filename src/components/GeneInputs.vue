<template>
  <div class="gene-inputs">
    <div class="gene-inputs_tabs-container">
      <v-tabs v-model="tab">
        <v-tab>Current</v-tab>
        <v-tab :class="{ 'gene-inputs_tab--animate': animatePreviousGenesTabIn }">Saved</v-tab>
      </v-tabs>
      <v-btn
        :tile="!$vuetify.breakpoint.xsOnly"
        :icon="$vuetify.breakpoint.xsOnly"
        :disabled="!isFormValid"
        v-if="!autoSaveInputSets && tab !== 1"
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
          <SaplingInputHighlights :inputString="saplingGenes" :highlightedMap="highlightedMap" />
          <SaplingListNumbering :saplingGeneList="saplingGeneList"></SaplingListNumbering>
          <v-textarea
            full-width
            ref="saplingGenesInput"
            class="gene-inputs_input"
            :placeholder="placeholder"
            label="Add your genes here..."
            :value="saplingGenes"
            @input="handleSaplingGenesInput($event)"
            @blur="handleSaplingGenesInputBlur"
            @keydown="handleSaplingGenesInputKeyDown($event)"
            outlined
            :disabled="disabled"
            :rows="Math.max(5, saplingGenes.split(`\n`).length || 0)"
            :rules="sourceSaplingRules"
            autocomplete="off"
          ></v-textarea>
          <SaplingListPreview :saplingGeneList="saplingGeneList" ref="saplingListPreview"></SaplingListPreview>
        </v-form>
      </v-tab-item>
      <v-tab-item eager>
        <PreviousGenes
          ref="previousGenes"
          :selectedPlantTypeName="selectedPlantTypeName"
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
  @Prop({ type: Boolean }) readonly disabled: boolean;
  @Prop({ type: Boolean }) readonly soundsEnabled: boolean;
  @Prop({ type: Boolean }) readonly autoSaveInputSets: boolean;
  @Prop({ type: String }) readonly selectedPlantTypeName: string;
  @Prop({ type: GeneticsMap, required: false }) readonly highlightedMap: GeneticsMap | null;

  // fix for Safari not respecting new line in placeholder
  placeholder = `YGXWHH\nXWHYYG\nGHGWYY\netc...`.replaceAll('\n', ' '.repeat(100));
  saplingGenes = `XYGWYW
WHYWHY
XYXWGH
WYGXYW
XHHWHH
WWGXYH
WWXXYX
WYHHHH
XYYWYW
YYXWXW
GHGWYG
HGGXYW
XGGXHW
WGGWHG
XYGXGW
WGGWGX`;
  isFormValid = false;
  animatePreviousGenesTabIn = false;
  tab = 0;

  sourceSaplingRules = [
    (v: string) => /^([GHWYX]{6}\n{1})*([GHWYX]{6}\n{0})*\n*$/.test(v) || 'You are almost there...',
    (v: string) => v !== '' || 'Give me some genes to work with!',
    (v: string) => !/^([GHWYX]{6}\n{0})*\n*$/.test(v) || 'Give me some more genes to work with!'
  ];

  get saplingGeneList() {
    return this.saplingGenes === '' ? [] : this.saplingGenes.trim().split(/\r?\n/);
  }

  handleSaplingGenesInput(value: string) {
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

  handleSaplingGenesInputBlur() {
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
    const wasAdded = (this.$refs.previousGenes as PreviousGenes).addNewSet(this.saplingGenes);
    if (wasAdded) {
      this.animatePreviousGenesTab();
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
