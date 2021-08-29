<template>
  <div class="text-center">
    <v-container class="pa-0">
      <v-row>
        <v-col class="px-3 py-1">
          <v-text-field
            type="number"
            label="No. of Gs"
            v-model="geneCount.gCount"
            autocomplete="off"
            :rules="geneCountRules"
          ></v-text-field>
        </v-col>
        <v-col class="px-3 py-1">
          <v-text-field
            type="number"
            label="No. of Ys"
            v-model="geneCount.yCount"
            autocomplete="off"
            :rules="geneCountRules"
          ></v-text-field>
        </v-col>
        <v-col class="px-3 py-1">
          <v-text-field
            type="number"
            label="No. of Hs"
            v-model="geneCount.hCount"
            autocomplete="off"
            :rules="geneCountRules"
          ></v-text-field>
        </v-col>
      </v-row>
      <v-divider></v-divider>
      <v-row class="mt-1">
        <v-col cols="4" md="2" v-for="n in 6" :key="n" class="px-3 py-0">
          <v-text-field
            type="text"
            :label="'Gene ' + n"
            v-model="filteringGenes['gene' + (n - 1)]"
            hint="Use / for alternative. Example: 'G/Y'."
            autocomplete="off"
          ></v-text-field>
        </v-col>
      </v-row>
    </v-container>
    <ul class="mt-3" :class="{ 'simulation-results--visible': addAnimationClass }">
      <li v-for="group in visibleMapGroups" :key="group.index">
        <SimulationMapGroup :group="group" v-on:select:map="handleSelectMapEvent" :highlightedMap="highlightedMap" />
      </li>
    </ul>
    <v-btn @click="showMore" v-if="hasMore" class="mt-2">Show more</v-btn>
  </div>
</template>

<script lang="ts">
import GeneEnum from '@/enums/gene.enum';
import GeneticsMap from '@/models/genetics-map.model';
import { MapGroup } from '@/services/optimizer-service/models';
import { Component, Vue, Prop } from 'vue-property-decorator';
import SimulationMapGroup from './SimulationMapGroup.vue';

@Component({
  components: { SimulationMapGroup }
})
export default class SimulationResults extends Vue {
  @Prop({ type: Array, required: true }) readonly mapGroups!: MapGroup[];
  @Prop({ type: Object }) readonly highlightedMap: GeneticsMap;

  addAnimationClass = false;

  filteringGenes: { [key: string]: string | null } = {
    gene0: '',
    gene1: '',
    gene2: '',
    gene3: '',
    gene4: '',
    gene5: ''
  };

  geneCount: { [key: string]: string | null } = {
    gCount: '',
    yCount: '',
    hCount: ''
  };

  geneCountRules = [
    (v: number) => !v || v >= 1 || 'At least one..',
    (v: number) => !v || v <= 6 || 'No more than six...'
  ];

  page = 1;

  get filteredMapGroups() {
    let mapGroups = this.mapGroups;
    [GeneEnum.Y, GeneEnum.G, GeneEnum.H].forEach((geneName) => {
      if (this.geneCount[`${geneName.toLowerCase()}Count`]) {
        mapGroups = mapGroups.filter(
          (group) =>
            (group.mapList[0].targetSapling[`numberOf${geneName}s`] as Function)() ===
            Number(this.geneCount[`${geneName.toLowerCase()}Count`])
        );
      }
    });

    if (
      this.filteringGenes.gene0 !== '' ||
      this.filteringGenes.gene1 !== '' ||
      this.filteringGenes.gene2 !== '' ||
      this.filteringGenes.gene3 !== '' ||
      this.filteringGenes.gene4 !== '' ||
      this.filteringGenes.gene5 !== ''
    ) {
      mapGroups = mapGroups.filter((group) => {
        let allGenesMatch = true;
        for (let i = 0; i < 6; i++) {
          if (
            this.filteringGenes[`gene${i}`] !== '' &&
            !(this.filteringGenes[`gene${i}`] || '')
              .toUpperCase()
              .split('/')
              .includes(group.mapList[0].targetSapling.genes[i].type)
          ) {
            allGenesMatch = false;
          }
        }
        return allGenesMatch;
      });
    }
    return mapGroups;
  }

  get visibleMapGroups() {
    return this.filteredMapGroups.slice(0, this.page * 10);
  }

  get hasMore() {
    return this.filteredMapGroups.length > this.visibleMapGroups.length;
  }

  created() {
    this.page = 1;
    setTimeout(() => {
      this.addAnimationClass = true;
    });
  }

  handleSelectMapEvent(map: GeneticsMap) {
    this.$emit('select:map', map);
  }

  showMore() {
    this.page = this.page + 1;
  }
}
</script>

<style scoped lang="scss">
ul {
  list-style: none;
  position: relative;
  margin: 0;
  padding: 0 !important;
  opacity: 0;
  top: 25px;
  transition: 0.2s ease-out;
  &.simulation-results--visible {
    opacity: 1;
    top: 0px;
  }
  li {
    display: block;
    &:not(:first-child) {
      margin-top: 10px;
    }
  }
}
</style>
