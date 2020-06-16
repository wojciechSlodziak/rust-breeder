<template>
  <div class="sapling-gene-repr">
    <template v-for="(gene, index) in sapling.genes">
      <span class="sapling-gene-repr_gene" :class="{ 'sapling-gene-repr_gene--red': !gene.isGreen() }" :key="index"
        ><span>{{ gene.type }}</span></span
      >
      <span class="sapling-gene-repr_separator" v-if="sapling.genes.length - 1 > index" :key="index + 'sep'">-</span>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import Sapling from '@/services/optimizer-service/models/sapling.model';

@Component
export default class SaplingGeneRepresentation extends Vue {
  @Prop({ type: Sapling, required: true }) readonly sapling!: Sapling;
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
    color: white;
    background-color: rgb(18, 158, 18);
    line-height: $radiusPX;
    span {
      vertical-align: middle;
    }
  }
  .sapling-gene-repr_gene--red {
    background-color: rgb(197, 0, 0);
  }
  .sapling-gene-repr_separator {
    display: inline-block;
    margin: 0 2px;
    user-select: none;
  }
}
</style>