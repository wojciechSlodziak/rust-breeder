<template>
  <div class="sapling-list-numbering">
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

  get showSpecial() {
    return this.saplingGeneList && this.saplingGeneList.length > 6;
  }
}
</script>

<style scoped lang="scss">
.sapling-list-numbering {
  margin-top: 11px;
  position: absolute;
  top: 0px;
  left: 1px;
  width: 25px;
}
ul {
  list-style: none;
  margin: 0;
  padding: 0;
  li {
    line-height: 1.75rem;
    text-align: center;
    font-size: 0.625rem;
    opacity: 0.5;
    &.sapling-list-numbering_number--special {
      border-top: 1px solid rgba(255, 166, 0, 0.75);
      margin-top: -1px;
    }
  }
}
</style>
