<template>
  <div :class="{ 'd-none': !mapGroups || mapGroups.length === 0 }">
    <v-form ref="form" v-model="isFormValid" spellcheck="false">
      <v-container class="px-3 py-0">
        <v-row>
          <v-col class="px-2 py-0">
            <v-text-field
              type="number"
              label="No. of Gs"
              v-model="geneCount.gCount"
              autocomplete="off"
              :rules="geneCountRules"
            ></v-text-field>
          </v-col>
          <v-col class="px-2 py-0">
            <v-text-field
              type="number"
              label="No. of Ys"
              v-model="geneCount.yCount"
              autocomplete="off"
              :rules="geneCountRules"
            ></v-text-field>
          </v-col>
          <v-col class="px-2 py-0">
            <v-text-field
              type="number"
              label="No. of Hs"
              v-model="geneCount.hCount"
              autocomplete="off"
              :rules="geneCountRules"
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row class="mt-0">
          <v-col cols="4" sm="2" v-for="n in 6" :key="n" class="px-2 py-0">
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
    </v-form>
    <div class="text-center">
      <div class="mt-5 orange--text" v-if="mapGroups && mapGroups.length > 0 && visibleMapGroups.length === 0">
        Filters you applied return no results!
      </div>
      <div class="mt-5 px-2" v-if="visibleMapGroups.length > 0">
        <div class="mt-5">Click on a Card to see more details about generations and crossbreeding!</div>
        <div class="hidden-md-and-up mt-2">Press and hold a Card to view alternative variants.</div>
      </div>
    </div>
    <ul class="mt-3 mb-12" v-if="visibleMapGroups.length > 0">
      <li v-for="(group, index) in visibleMapGroups" :key="group.resultSaplingGeneString">
        <SimulationMapGroup
          :group="group"
          :index="index"
          v-on:map-selected="handleMapSelectedEvent"
          v-on:group-selected="handleGroupSelectedEvent"
          :highlighted-map="highlightedMap"
        />
        <InViewAnchor
          :key="index"
          v-if="hasMore && index === visibleMapGroups.length - 2"
          @in-view="showMore"
        ></InViewAnchor>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import GeneEnum from '@/enums/gene.enum';
import { GeneticsMap, GeneticsMapGroup } from '@/services/crossbreeding-service/models';
import { Component, Vue, Prop } from 'vue-property-decorator';
import InViewAnchor from './InViewAnchor.vue';
import SimulationMapGroup from './SimulationMapGroup.vue';

@Component({
  components: { SimulationMapGroup, InViewAnchor }
})
export default class SimulationResults extends Vue {
  @Prop({ type: Array }) readonly mapGroups: GeneticsMapGroup[];
  @Prop({ type: Object }) readonly highlightedMap: GeneticsMap;

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
    (v: number) => !v || v >= 0 || 'Minimum is zero..',
    (v: number) => !v || v <= 6 || 'No more than six...',
    (v: number) => !v || v % 1 === 0 || 'Must be a whole number...'
  ];

  page = 2;
  itemsPerPage = 3;
  isFormValid = true;

  get filteredMapGroups() {
    let mapGroups = this.mapGroups || [];

    if (!this.isFormValid) {
      return mapGroups;
    }

    [GeneEnum.Y, GeneEnum.G, GeneEnum.H].forEach((geneName) => {
      if (this.geneCount[`${geneName.toLowerCase()}Count`]) {
        mapGroups = mapGroups.filter(
          (group) =>
            (group.mapList[0].resultSapling[`numberOf${geneName}s`] as Function)() ===
            Number(this.geneCount[`${geneName.toLowerCase()}Count`])
        );
      }
    });

    if (this.hasGeneFiltersApplied) {
      mapGroups = mapGroups.filter((group) => {
        let allGenesMatch = true;
        for (let i = 0; i < 6; i++) {
          if (
            this.filteringGenes[`gene${i}`] !== '' &&
            !(this.filteringGenes[`gene${i}`] || '')
              .toUpperCase()
              .split('/')
              .includes(group.mapList[0].resultSapling.genes[i].type)
          ) {
            allGenesMatch = false;
          }
        }
        return allGenesMatch;
      });
    }

    return mapGroups;
  }

  get hasGeneFiltersApplied() {
    return (
      this.filteringGenes.gene0 !== '' ||
      this.filteringGenes.gene1 !== '' ||
      this.filteringGenes.gene2 !== '' ||
      this.filteringGenes.gene3 !== '' ||
      this.filteringGenes.gene4 !== '' ||
      this.filteringGenes.gene5 !== ''
    );
  }

  get visibleMapGroups() {
    return this.filteredMapGroups.slice(0, this.page * this.itemsPerPage);
  }

  get hasMore() {
    return this.filteredMapGroups.length > this.visibleMapGroups.length;
  }

  handleMapSelectedEvent(map: GeneticsMap) {
    this.$emit('map-selected', map);
  }

  handleGroupSelectedEvent(group: GeneticsMapGroup) {
    this.$emit('group-selected', group);
  }

  resetPage() {
    this.page = 2;
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
  top: 25px;
  li {
    display: block;
    &:not(:first-child) {
      margin-top: 10px;
    }
  }
}
</style>
