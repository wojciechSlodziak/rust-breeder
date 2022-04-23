<template>
  <v-card
    v-ripple="isDummy || isHighlight ? false : true"
    class="map"
    :class="{ 'map--hidden': isDummy }"
    :style="{ height: isDummy ? forcedHeight + 'px' : 'auto' }"
    outlined
  >
    <v-list-item class="map_header">
      <v-list-item-content>
        <v-list-item-title class="headline">
          <SaplingGeneRepresentation :sapling="map.resultSapling" class="map_result-sapling" />
        </v-list-item-title>
        <v-list-item-subtitle class="mt-2">
          <span class="map_score"
            >Score: <span>{{ map.score }}</span></span
          >&nbsp;&middot;&nbsp;
          <span class="map_chance" :class="chanceClass">
            Chance: <span>{{ map.chancePercent }}%</span>
          </span>
        </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
    <v-divider class="mx-4"></v-divider>
    <v-card-text class="map_detail">
      <v-tooltip bottom open-delay="250">
        <template v-slot:activator="{ on, attrs }">
          <div v-bind="attrs" v-on="on" class="mb-4">
            <div class="mb-1">
              Center Sapling:<span class="white--text" v-if="!map.baseSapling"><br />any extra random plant</span>
            </div>
            <SaplingGeneRepresentation :sapling="map.baseSapling" v-if="map.baseSapling" />
          </div>
        </template>
        <span
          >Sapling that should be placed in the middle of the Surrounding Saplings. It has to reach Crossbreeding stage
          <strong>before</strong> the Surrounding Saplings reach it. As a rule of thumb let it grow alone until it
          reaches about 50% progress in <strong>Sapling</strong> stage. After that, plant the Surrounding
          Saplings.</span
        >
      </v-tooltip>
      <v-divider class="mb-5"></v-divider>
      <v-tooltip bottom open-delay="250">
        <template v-slot:activator="{ on, attrs }">
          <div v-bind="attrs" v-on="on">
            <div class="mb-1">Surrounding Saplings:</div>
            <SaplingGeneRepresentation
              :sapling="crossbreedSapling"
              v-for="(crossbreedSapling, index) in map.crossbreedSaplings"
              :key="index"
            />
          </div>
        </template>
        <span
          >Saplings that should be planted around the Center Sapling before it goes into
          <strong>Crossbreeding</strong> stage. All Saplings have to be of the same type!</span
        >
      </v-tooltip>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import GeneticsMap from '../models/genetics-map.model';
import SaplingGeneRepresentation from './SaplingGeneRepresentation.vue';

@Component({
  components: { SaplingGeneRepresentation }
})
export default class SimulationMap extends Vue {
  @Prop({ type: Object, required: true }) readonly map!: GeneticsMap;
  @Prop({ type: Boolean }) isDummy: boolean;
  @Prop({ type: Boolean }) isHighlight: boolean;
  @Prop({ type: Number }) forcedHeight: number;

  get chanceClass() {
    let chanceClass = 'map_chance--';
    if (this.map.chancePercent >= 75) {
      chanceClass += 'high';
    } else if (this.map.chancePercent >= 50) {
      chanceClass += 'moderate';
    } else {
      chanceClass += 'low';
    }
    return chanceClass;
  }
}
</script>

<style scoped lang="scss">
.map {
  color: lightgray;
  text-align: center;
  width: 320px;
  .map_header {
    .map_score {
      span {
        font-weight: bold;
        color: white;
      }
    }
    .map_chance {
      span {
        font-weight: bold;
      }
      &.map_chance--low span {
        color: rgb(187, 49, 49);
      }
      &.map_chance--moderate span {
        color: rgb(223, 145, 0);
      }
      &.map_chance--high span {
        color: rgb(31, 196, 31);
      }
    }
  }
  &.map--hidden {
    .map_header,
    .map_detail {
      visibility: hidden;
    }
  }
  .map_result-sapling {
    background-color: #191919;
  }
}
</style>
