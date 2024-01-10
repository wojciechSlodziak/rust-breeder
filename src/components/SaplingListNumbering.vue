<template>
  <div class="sapling-list-numbering">
    <span class="sapling-list-numbering_legend" v-if="showLegend">#</span>
    <ul>
      <li
        class="sapling-list-numbering_number"
        :class="{
          'sapling-list-numbering_number--special': index !== 0 && index % 6 === 0 && showSpecial
        }"
        v-for="(saplingGenes, index) in saplingGeneList"
        :key="index"
      >
        {{ index + 1 }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import SaplingGeneRepresentation from './SaplingGeneRepresentation.vue';

@Component({
  components: { SaplingGeneRepresentation }
})
export default class SaplingListNumbering extends Vue {
  @Prop({ type: Array, required: true }) readonly saplingGeneList!: string[];

  get showLegend() {
    return this.saplingGeneList && this.saplingGeneList.length > 0;
  }

  get showSpecial() {
    return this.saplingGeneList && this.saplingGeneList.length > 6;
  }
}
</script>

<style scoped lang="scss">
.theme--light .sapling-list-numbering {
  opacity: 0.8;
}
.sapling-list-numbering {
  padding-top: 11px;
  position: absolute;
  top: 0px;
  left: 1px;
  width: 25px;
  opacity: 0.5;
  text-align: center;
  .sapling-list-numbering_legend {
    position: absolute;
    font-size: 0.625rem;
    line-height: 1em;
    left: 0;
    top: 15px;
    transform: translateY(-100%);
    width: 100%;
    user-select: none;
  }
}
ul {
  list-style: none;
  margin: 0;
  padding: 0;
  li {
    line-height: 1.75rem;
    text-align: center;
    font-size: 0.625rem;
    &.sapling-list-numbering_number--special {
      border-top: 2px solid $c-color-dark-orange;
      margin-top: -2px;
    }
  }
}
</style>
