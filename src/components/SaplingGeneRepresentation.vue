<template>
  <div class="sapling-gene-repr">
    <span class="sapling-gene-repr_gene-container" v-for="(gene, index) in genes" :key="index">
      <span
        class="sapling-gene-repr_gene"
        :class="{
          'sapling-gene-repr_gene--red': typeof gene !== 'string' && !gene.isGreen,
          'sapling-gene-repr_gene--green': typeof gene !== 'string' && gene.isGreen,
          'sapling-gene-repr_gene--invalid': typeof gene === 'string',
          'sapling-gene-repr_gene--highlight-error': highlightErrors && typeof gene === 'string'
        }"
        ><span>{{ typeof gene !== 'string' ? gene.type : gene }}</span></span
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
  @Prop({ type: Boolean, default: false }) readonly highlightErrors: boolean;

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

.theme--light .sapling-gene-repr {
  --invalid-gene-bg-color: #cbcbcb;
  --invalid-gene-color: rgba(0, 0, 0, 0.87);
}
.sapling-gene-repr {
  --invalid-gene-bg-color: #3d3d3d;
  --invalid-gene-color: white;
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
    background-color: var(--invalid-gene-bg-color);
    line-height: $radiusPX;
  }
  .sapling-gene-repr_gene--invalid {
    color: var(--invalid-gene-color);
  }
  .sapling-gene-repr_gene--green {
    background-color: $c-color-dark-green;
  }
  .sapling-gene-repr_gene--red {
    background-color: $c-color-dark-red;
  }
  .sapling-gene-repr_gene--highlight-error span {
    display: block;
    animation-duration: 3s;
    animation-name: highlight-error-animation;
    animation-iteration-count: infinite;
    animation-timing-function: ease-in-out;
  }
  .sapling-gene-repr_separator {
    display: inline-block;
    color: #505050;
    margin: 0 2px;
    vertical-align: middle;
    user-select: none;
  }
}

@keyframes highlight-error-animation {
  0% {
    transform: scale(1);
  }
  15% {
    transform: scale(0.9);
  }
  25% {
    transform: scale(2.25);
  }
  35% {
    transform: scale(1);
  }
  45% {
    transform: scale(2.25);
  }
  60% {
    transform: scale(1);
  }
}
</style>
