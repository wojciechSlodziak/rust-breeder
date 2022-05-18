<template>
  <v-card
    v-ripple="enableMapSelection && !isDummy"
    class="map"
    :class="{ 'map--hidden': isDummy, 'map--selectable': enableMapSelection }"
    :style="{ height: isDummy ? forcedHeight + 'px' : 'auto' }"
    outlined
  >
    <v-list-item class="map_header">
      <v-list-item-content>
        <v-list-item-title>
          <SaplingGeneRepresentation :sapling="map.resultSapling" class="map_sapling map_result-sapling" />
        </v-list-item-title>
        <v-list-item-subtitle class="mt-2">
          <span class="map_gen" :class="genClass">GEN.{{ map.resultSapling.generationIndex }}</span
          >&nbsp;&middot;&nbsp;<span class="map_score"
            >Score: <span>{{ map.score }}</span></span
          >&nbsp;&middot;&nbsp;<span class="map_chance" :class="chanceClass"
            >Chance: <span>{{ map.chancePercent }}%</span>
          </span>
        </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
    <v-divider class="mx-4"></v-divider>
    <v-card-text class="map_detail">
      <v-tooltip bottom open-delay="250" :disabled="!enableMapSelection">
        <template v-slot:activator="{ on, attrs }">
          <div v-bind="attrs" v-on="on" class="mb-4">
            <div class="mb-1">
              Center Sapling:<span class="white--text" v-if="!map.baseSapling"><br />any extra random plant</span>
            </div>
            <SaplingGeneRepresentation class="map_sapling" :sapling="map.baseSapling" v-if="map.baseSapling" />
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
      <v-tooltip bottom open-delay="250" :disabled="!enableMapSelection">
        <template v-slot:activator="{ on, attrs }">
          <div v-bind="attrs" v-on="on">
            <div class="mb-1">Surrounding Saplings:</div>
            <ul>
              <li class="map_sapling-list" v-for="(crossbreedSapling, index) in map.crossbreedSaplings" :key="index">
                <span
                  class="map_sapling-generation"
                  :class="{ 'map_sapling-generation--subtle': !enableCrossbreedingSaplingSelection }"
                  >GEN.{{ crossbreedSapling.generationIndex }}</span
                >
                <SaplingGeneRepresentation
                  class="map_sapling"
                  :class="{
                    'map_sapling--selectable':
                      enableCrossbreedingSaplingSelection && crossbreedSapling.generationIndex > 0
                  }"
                  :sapling="crossbreedSapling"
                  @click.native="
                    enableCrossbreedingSaplingSelection &&
                      crossbreedSapling.generationIndex > 0 &&
                      handleCrossbreedingSaplingSelection(index)
                  "
                />
              </li>
            </ul>
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
import { GeneticsMap } from '@/services/optimizer-service/models';
import { Component, Vue, Prop } from 'vue-property-decorator';
import SaplingGeneRepresentation from './SaplingGeneRepresentation.vue';
import SimulationMapGroup from './SimulationMapGroup.vue';

@Component({
  components: { SaplingGeneRepresentation, SimulationMapGroup }
})
export default class SimulationMap extends Vue {
  @Prop({ type: Object, required: true }) readonly map!: GeneticsMap;
  @Prop({ type: Boolean }) isDummy: boolean;
  @Prop({ type: Boolean }) enableCrossbreedingSaplingSelection: boolean;
  @Prop({ type: Boolean }) enableMapSelection: boolean;
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

  get genClass() {
    return `map_gen--${this.map.resultSapling.generationIndex}`;
  }

  handleCrossbreedingSaplingSelection(crossbreedSaplingIndex: number) {
    if (this.map.crossbreedSaplingsVariants) {
      console.log(this.map.crossbreedSaplingsVariants[crossbreedSaplingIndex]);
      this.$emit('crossbreeding-sapling-selected', this.map.crossbreedSaplingsVariants[crossbreedSaplingIndex]);
    }
  }
}
</script>

<style scoped lang="scss">
.map {
  color: lightgray;
  text-align: center;
  width: 320px;
  &.map--selectable {
    cursor: pointer;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    li {
      padding: 5px 0;
    }
  }
  .map_header {
    .map_score {
      span {
        font-weight: bold;
        color: white;
      }
    }
    .map_chance,
    .map_gen {
      font-weight: bold;
    }
    .map_chance--low span,
    .map_gen--3 {
      color: rgb(241, 66, 66);
    }
    .map_chance--moderate span,
    .map_gen--2 {
      color: rgb(223, 145, 0);
    }
    .map_chance--high span,
    .map_gen--1 {
      color: rgb(31, 196, 31);
    }
  }
  .map_sapling-list {
    position: relative;
    display: flex;
    justify-content: center;
  }
  .map_sapling {
    font-size: 1rem;
  }
  .map_sapling--selectable {
    transition: outline-color 0.15s;
    user-select: none;
    outline: 2px double rgba(223, 145, 0, 0.3);
    outline-offset: 2px;
  }
  .map_sapling--selectable:hover {
    outline: 2px double rgba(223, 145, 0, 0.8);
    cursor: pointer;
  }
  .map_sapling--selectable:active {
    outline: 2px double rgb(223, 145, 1);
  }
  &.map--hidden {
    .map_header,
    .map_detail {
      visibility: hidden;
    }
  }
  .map_result-sapling {
    background-color: #191919;
    padding: 5px 0;
  }
  .map_sapling-generation {
    position: absolute;
    display: inline-block;
    font-size: 0.7em;
    left: -0.5em;
    top: 0.75em;
    user-select: none;
    &.map_sapling-generation--subtle {
      opacity: 0.3;
    }
  }
}
</style>
