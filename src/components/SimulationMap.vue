<template>
  <v-card
    v-ripple
    class="map"
    :class="{ 'map--hidden': isDummy }"
    :style="{ height: isDummy ? forcedHeight + 'px' : 'auto' }"
    outlined
  >
    <v-list-item class="map_header">
      <v-list-item-content>
        <v-list-item-title class="headline">
          <SaplingGeneRepresentation :sapling="map.targetSapling" class="map_target-sapling" />
        </v-list-item-title>
        <v-list-item-subtitle class="mt-1">
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
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <div v-bind="attrs" v-on="on" style="cursor:default" class="mb-4">
            <div class="mb-1">Base Sapling:<span class="white--text" v-if="!map.baseSapling"> any</span></div>
            <SaplingGeneRepresentation :sapling="map.baseSapling" v-if="map.baseSapling" />
          </div>
        </template>
        <span>Sapling that should be used as a center plant.</span>
      </v-tooltip>
      <v-divider class="mb-5"></v-divider>
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <div v-bind="attrs" v-on="on" style="cursor:default">
            <div class="mb-1">Crossbreeding Saplings:</div>
            <SaplingGeneRepresentation
              :sapling="crossbreedSapling"
              v-for="(crossbreedSapling, index) in map.crossbreedSaplings"
              :key="index"
            />
          </div>
        </template>
        <span
          >Saplings that should be planted around the Base Sapling, just before it goes into
          <strong>crossbreeding</strong> stage.</span
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
        color: rgb(197, 0, 0);
      }
      &.map_chance--moderate span {
        color: rgb(223, 145, 0);
      }
      &.map_chance--high span {
        color: rgb(18, 158, 18);
      }
    }
  }
  &.map--hidden {
    .map_header,
    .map_detail {
      visibility: hidden;
    }
  }
  .map_target-sapling {
    background-color: #191919;
  }
}
</style>
