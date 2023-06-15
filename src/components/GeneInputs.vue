<template>
  <div>
    <SaplingInputHighlights :inputString="saplingGenes" :highlightedMap="highlightedMap" />
    <SaplingListNumbering :saplingGeneList="saplingGeneList"></SaplingListNumbering>
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
      :disabled="disabled"
      :rows="Math.max(5, saplingGenes.split(`\n`).length || 0)"
      :rules="sourceSaplingRules"
      autocomplete="off"
    ></v-textarea>
    <SaplingListPreview :saplingGeneList="saplingGeneList" ref="saplingListPreview"></SaplingListPreview>
  </div>
</template>

<script lang="ts">
import SaplingInputHighlights from './SaplingInputHighlights.vue';
import SaplingListPreview from './SaplingListPreview.vue';
import SaplingListNumbering from './SaplingListNumbering.vue';

import { Component, Prop, Vue } from 'vue-property-decorator';
import { GeneticsMap } from '@/services/crossbreeding-service/models';
import { playAudio } from '@/lib/ui-utils';

@Component({
  components: {
    SaplingInputHighlights,
    SaplingListPreview,
    SaplingListNumbering
  }
})
export default class GeneInputs extends Vue {
  @Prop({ type: Boolean }) readonly disabled: boolean;
  @Prop({ type: Boolean }) readonly soundsEnabled: boolean;
  @Prop({ type: GeneticsMap, required: false }) readonly highlightedMap: GeneticsMap | null;

  // fix for Safari not respecting new line in placeholder
  placeholder = `YGXWHH\nXWHYYG\nGHGWYY\netc...`.replaceAll('\n', ' '.repeat(100));
  saplingGenes = ``;

  sourceSaplingRules = [
    (v: string) => v !== '' || 'Give me some plants to work with!',
    (v: string) => /^([GHWYX]{6}\n{1})*([GHWYX]{6}\n{0})*\n*$/.test(v) || 'You are almost there...'
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
        this.onNextTickRerender(() => {
          textarea.selectionEnd = caretPosition + (this.saplingGenes.length - value.length);
        });
      });
    }
    this.$emit('genes-change', this.saplingGenes);
  }

  handleSaplingGenesInputBlur() {
    this.saplingGenes = this.saplingGenes.replaceAll(/[\n]{2,}/g, '\n');
    this.saplingGenes = this.getDeduplicatedSaplingGeneList().join('\n');
    this.$emit('genes-change', this.saplingGenes);
  }

  handleSaplingScannedEvent(value: string) {
    if (this.saplingGenes.indexOf(value) === -1) {
      if (!this.saplingGenes.charAt(this.saplingGenes.length - 1).match(/\r?\n/) && this.saplingGenes.length !== 0) {
        this.saplingGenes += '\n';
      }
      this.saplingGenes += value;
      this.animateAndScrollToLastSapling();
      this.playSaplingsScannedSound();
    }
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
