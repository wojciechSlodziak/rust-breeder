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

  page = 1;

  get visibleMapList() {
    return this.mapList.slice(0, this.page * 100);
  }

  get hasMore() {
    return this.mapList.length > this.visibleMapList.length;
  }

  showMore() {
    this.page = this.page + 1;
  }

  created() {
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
