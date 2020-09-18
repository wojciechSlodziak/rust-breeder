<template>
  <div class="text-center">
    <v-container class="pa-0">
      <v-row>
        <v-col v-for="n in 6" :key="n">
          <v-text-field type="text" :label="'Gene ' + n" v-model="filteringGenes['gene' + (n - 1)]"></v-text-field>
        </v-col>
      </v-row>
    </v-container>

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

  filteringGenes: { [key: string]: string | null } = {
    gene0: '',
    gene1: '',
    gene2: '',
    gene3: '',
    gene4: '',
    gene5: ''
  };

  page = 1;

  get filteredMapList() {
    console.log(this.filteringGenes);
    if (
      this.filteringGenes.gene0 !== '' ||
      this.filteringGenes.gene1 !== '' ||
      this.filteringGenes.gene2 !== '' ||
      this.filteringGenes.gene3 !== '' ||
      this.filteringGenes.gene4 !== '' ||
      this.filteringGenes.gene5 !== ''
    ) {
      return this.mapList.filter((map) => {
        let allGenesMatch = true;
        for (let i = 0; i < 6; i++) {
          if (
            this.filteringGenes[`gene${i}`] !== '' &&
            map.targetSapling.genes[i].type !== (this.filteringGenes[`gene${i}`] || '').toUpperCase()
          ) {
            allGenesMatch = false;
          }
        }
        return allGenesMatch;
      });
    }
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
