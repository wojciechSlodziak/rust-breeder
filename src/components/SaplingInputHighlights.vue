<template>
  <div class="input-highlights">
    <div
      v-for="(highlightPosition, index) in crossbreedingHighlightsPositions"
      class="input-highlights_gene-highlight"
      :key="index"
      :style="{
        top: 7 + highlightPosition.position * 28 + 'px'
      }"
      :class="{ 'input-highlights_gene-highlight--for-base': highlightPosition.isBase }"
    >
      {{ highlightPosition.saplingGeneString }}
    </div>
  </div>
</template>

<script lang="ts">
import Sapling from '@/models/sapling.model';
import { GeneticsMap } from '@/services/crossbreeding-service/models';
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class SaplingInputHighlights extends Vue {
  @Prop({ type: Object }) readonly highlightedMap: GeneticsMap;
  @Prop({ type: String }) readonly inputString: string;

  get crossbreedingHighlightsPositions() {
    let positions: { position: number; saplingGeneString: string; isBase: boolean }[] = [];
    if (this.highlightedMap && this.inputString) {
      positions = [
        ...positions,
        ...this.calculatePositions(this.highlightedMap.crossbreedingSaplings).map((positionData) => ({
          ...positionData,
          isBase: false
        }))
      ];

      if (this.highlightedMap.baseSapling) {
        positions = [
          ...positions,
          ...this.calculatePositions([this.highlightedMap.baseSapling]).map((positionData) => ({
            ...positionData,
            isBase: true
          }))
        ];
      }
    }
    return positions;
  }

  get baseHighlightsPositions() {
    if (this.highlightedMap && this.highlightedMap.baseSapling && this.inputString) {
      return this.calculatePositions([this.highlightedMap.baseSapling]);
    }
    return [];
  }

  calculatePositions(saplingList: Sapling[]) {
    const positions: { position: number; saplingGeneString: string }[] = [];
    const inputSaplingStrings = this.inputString.trim().split(/\r?\n/);
    saplingList.forEach((sapling) => {
      const saplingGeneString = sapling.genes.map((gene) => gene.type.toString()).join('');
      const position = inputSaplingStrings.indexOf(saplingGeneString);
      if (position !== -1 && positions.map((positionObj) => positionObj.position).indexOf(position) === -1) {
        positions.push({ position, saplingGeneString: saplingGeneString });
      }
    });
    return positions;
  }
}
</script>

<style scoped lang="scss">
.input-highlights {
  user-select: none;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  .input-highlights_gene-highlight {
    color: transparent;
    padding-left: 9px;
    padding-right: 9px;
    position: absolute;
    height: 20px;
    margin-top: 7px;
    left: 15px;
    background: linear-gradient(90deg, transparent 0%, #425c18 15%, #425c18 85%, transparent 100%);
    &.input-highlights_gene-highlight--for-base {
      background: linear-gradient(90deg, transparent 0%, #666666 15%, #666666 85%, transparent 100%);
    }
  }
}
.theme--light {
  .input-highlights {
    .input-highlights_gene-highlight {
      background: linear-gradient(90deg, transparent 0%, #59e659 15%, #59e659 85%, transparent 100%);
      &.input-highlights_gene-highlight--for-base {
        background: linear-gradient(90deg, transparent 0%, #d3d3d3 15%, #d3d3d3 85%, transparent 100%);
      }
    }
  }
}
</style>
