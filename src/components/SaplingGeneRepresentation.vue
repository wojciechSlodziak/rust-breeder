<template>
  <div class="sapling-gene-repr">
    <span class="sapling-gene-repr_gene-container" v-for="(gene, index) in genes" :key="index">
      <span
        class="sapling-gene-repr_gene"
        :class="{
          'sapling-gene-repr_gene--red': typeof gene !== 'string' && gene.isRed(),
          'sapling-gene-repr_gene--green': typeof gene !== 'string' && gene.isGreen()
        }"
        ><span>{{ typeof gene !== 'string' ? gene.toString() : gene }}</span></span
      >
      <span class="sapling-gene-repr_separator" v-if="genes.length - 1 > index" :key="index + 'sep'">-</span>
    </span>
  </div>
</template>

<script lang="ts">
import Gene from '@/models/gene.model';
import { Component, Vue, Prop } from 'vue-property-decorator';
import Sapling from '../models/sapling.model';

@Component
export default class SaplingGeneRepresentation extends Vue {
  @Prop({ type: Object, required: true }) readonly sapling!: Sapling;

  get genes(): (Gene | string)[] {
    if (this.sapling.genes.length > 6) {
      return new Array(6).fill('!');
    }
    return [...this.sapling.genes, ...new Array(6 - this.sapling.genes.length).fill('?')];
  }
}
</script>

<style scoped lang="scss">
$radiusPX: 1.5625em;

.sapling-gene-repr {
  font-size: 1em;
  .sapling-gene-repr_gene-container {
    display: inline-block;
    height: 1.5625em;
  }
  .sapling-gene-repr_gene {
    display: inline-block;
    text-align: center;
    height: $radiusPX;
    width: $radiusPX;
    border-radius: 50%;
    vertical-align: middle;
    color: white;
    background-color: #2b2b2b;
    line-height: $radiusPX;
  }
  .sapling-gene-repr_gene--green {
    background-color: #5e861e;
  }
  .sapling-gene-repr_gene--red {
    background-color: #9b4433;
  }
  .sapling-gene-repr_separator {
    display: inline-block;
    color: #505050;
    margin: 0 2px;
    vertical-align: middle;
    user-select: none;
  }
}
</style>
