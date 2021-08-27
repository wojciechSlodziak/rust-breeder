<template>
  <div class="sapling-gene-repr">
    <template v-for="(gene, index) in sapling.genes">
      <span
        class="sapling-gene-repr_gene"
        :class="{ 'sapling-gene-repr_gene--red': gene.isRed, 'sapling-gene-repr_gene--green': gene.isGreen }"
        :key="index"
        ><span>{{ gene.text }}</span></span
      >
      <span class="sapling-gene-repr_separator" v-if="sapling.genes.length - 1 > index" :key="index + 'sep'">-</span>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import Sapling from '../models/sapling.model';

@Component
export default class SaplingGeneRepresentation extends Vue {
  @Prop({ type: Object, required: true }) readonly sapling!: Sapling;
}
</script>

<style scoped lang="scss">
$radiusPX: 25px;

.sapling-gene-repr {
  font-size: 1rem;
  padding: 5px 0;
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
