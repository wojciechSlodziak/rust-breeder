<template>
  <ul :class="{ 'simulation-results--visible': animate }">
    <li v-for="(map, index) in mapList" :key="index">
      <SimulationMapRow :map="map" />
    </li>
  </ul>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import GeneticsMap from '../services/optimizer-service/models/genetics-map.model';
import SimulationMapRow from './SimulationMapRow.vue';

@Component({
  components: { SimulationMapRow }
})
export default class SimulationResults extends Vue {
  @Prop({ type: Array, required: true }) readonly mapList!: GeneticsMap[];

  animate = false;

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
