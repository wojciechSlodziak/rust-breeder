<template>
  <div class="text-center">
    <ul :class="{ 'simulation-results--visible': animate }">
      <li v-for="(map, index) in visibleMapList" :key="index">
        <SimulationMapRow :map="map" />
      </li>
    </ul>
    <v-btn @click="showMore" v-if="hasMore" class="mt-2">Show more</v-btn>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import GeneticsMap from '../models/genetics-map.model';
import SimulationMapRow from './SimulationMapRow.vue';

@Component({
  components: { SimulationMapRow }
})
export default class SimulationResults extends Vue {
  @Prop({ type: Array, required: true }) readonly mapList!: GeneticsMap[];

  animate = false;

  // filteringGenes = {
  //   gene0: null,
  //   gene1: null,
  //   gene2: null,
  //   gene3: null,
  //   gene4: null,
  //   gene5: 'Y',
  // }

  page = 1;

  get filteredMapList() {
    // const gene = Y
    return this.mapList;
  }

  get visibleMapList() {
    return this.filteredMapList.slice(0, this.page * 20);
  }

  get hasMore() {
    return this.filteredMapList.length > this.visibleMapList.length;
  }

  showMore() {
    this.page = this.page + 1;
  }

  created() {
    this.page = 1;
    setTimeout(() => {
      this.animate = true;
    });
  }
}
</script>

<style scoped lang="scss">
ul {
  list-style: none;
  margin: 0;
  padding: 0 !important;
  opacity: 0;
  transform: translatey(-25px);
  transition: 0.2s ease-out;
  &.simulation-results--visible {
    opacity: 1;
    transform: translatey(0px);
  }
  li {
    display: block;
    &:not(:first-child) {
      margin-top: 7px;
    }
  }
}
</style>
