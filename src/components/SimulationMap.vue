<template>
  <v-card
    v-ripple="enableRipple"
    class="map"
    :class="{ 'map--selectable': enableMapSelection }"
    :style="{ height: forcedHeight ? forcedHeight + 'px' : 'auto' }"
    outlined
  >
    <v-list-item class="map_header">
      <v-list-item-content>
        <v-list-item-title>
          <SaplingGeneRepresentation :sapling="map.resultSapling" class="map_sapling map_result-sapling" />
        </v-list-item-title>
        <v-list-item-subtitle class="mt-2 map_header-subtitle">
          <span class="map_gen" :class="genClass">GEN.{{ map.resultSapling.generationIndex }}</span
          >&nbsp;&middot;&nbsp;<span class="map_score"
            >Score: <span>{{ map.score }}</span></span
          >&nbsp;&middot;&nbsp;<span class="map_chance" :class="chanceClass"
            >Chance: <span>{{ Math.round(map.chance * 100) }}%</span>
          </span>
        </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
    <v-divider class="mx-4"></v-divider>
    <v-card-text class="map_detail">
      <v-tooltip bottom open-delay="250" :disabled="!enableTooltip || $vuetify.breakpoint.xsOnly">
        <template v-slot:activator="{ on, attrs }">
          <div v-bind="attrs" v-on="on">
            <div class="mb-1">
              Center Sapling:
              <div class="white--text mb-4" v-if="!map.baseSapling">any extra random plant</div>
            </div>
            <div class="map_base-sapling-container mb-4" v-if="map.baseSapling">
              <span
                class="map_sapling-generation"
                :class="{ 'map_sapling-generation--subtle': !enableComposingSaplingsSelection }"
                >GEN.{{ map.baseSapling.generationIndex }}</span
              >
              <SaplingGeneRepresentation
                class="map_sapling"
                :class="{
                  'map_sapling--selectable':
                    enableComposingSaplingsSelection && map.baseSapling && map.baseSapling.generationIndex > 0
                }"
                :sapling="map.baseSapling"
                @click.native="
                  enableComposingSaplingsSelection &&
                    map.baseSapling &&
                    map.baseSapling.generationIndex > 0 &&
                    handleBaseSaplingSelection()
                "
              />
              <span
                v-if="map.baseSapling.generationIndex > 0"
                class="map_sapling-chance"
                :class="{
                  'map_sapling-chance--subtle': !enableComposingSaplingsSelection,
                  'map_sapling-chance--moderate': map.baseSaplingVariants
                    ? map.baseSaplingVariants.mapList[0].chance <= 0.5
                    : false
                }"
                >{{ map.baseSaplingVariants ? Math.round(map.baseSaplingVariants.mapList[0].chance * 100) : '' }}%</span
              >
            </div>
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
      <v-tooltip bottom open-delay="250" :disabled="!enableTooltip || $vuetify.breakpoint.xsOnly">
        <template v-slot:activator="{ on, attrs }">
          <div v-bind="attrs" v-on="on">
            <div class="mb-1">Surrounding Saplings:</div>
            <ul>
              <li
                class="map_sapling-list"
                v-for="(crossbreedingSapling, index) in map.crossbreedingSaplings"
                :key="index"
              >
                <span
                  class="map_sapling-generation"
                  :class="{
                    'map_sapling-generation--subtle': !enableComposingSaplingsSelection
                  }"
                  >GEN.{{ crossbreedingSapling.generationIndex }}</span
                >
                <SaplingGeneRepresentation
                  class="map_sapling"
                  :class="{
                    'map_sapling--selectable':
                      enableComposingSaplingsSelection && crossbreedingSapling.generationIndex > 0
                  }"
                  :sapling="crossbreedingSapling"
                  @click.native="
                    enableComposingSaplingsSelection &&
                      crossbreedingSapling.generationIndex > 0 &&
                      handleCrossbreedingSaplingSelection(index)
                  "
                />
                <span
                  v-if="crossbreedingSapling.generationIndex > 0"
                  class="map_sapling-chance"
                  :class="{
                    'map_sapling-chance--subtle': !enableComposingSaplingsSelection,
                    'map_sapling-chance--moderate':
                      enableComposingSaplingsSelection &&
                      map.crossbreedingSaplingsVariants &&
                      map.crossbreedingSaplingsVariants[index]
                        ? map.crossbreedingSaplingsVariants[index].mapList[0].chance <= 0.5
                        : false
                  }"
                  >{{
                    map.crossbreedingSaplingsVariants
                      ? Math.round(map.crossbreedingSaplingsVariants[index].mapList[0].chance * 100)
                      : ''
                  }}%</span
                >
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
  @Prop({ type: Boolean }) readonly enableComposingSaplingsSelection: boolean;
  @Prop({ type: Boolean }) readonly enableMapSelection: boolean;
  @Prop({ type: Boolean }) readonly enableTooltip: boolean;
  @Prop({ type: Boolean }) readonly enableRipple: boolean;
  @Prop({ type: Number }) readonly forcedHeight: number;

  get chanceClass() {
    let chanceClass = 'map_chance--';
    if (this.map.chance > 0.5) {
      chanceClass += 'high';
    } else {
      chanceClass += 'moderate';
    }
    return chanceClass;
  }

  get genClass() {
    return `map_gen--${this.map.resultSapling.generationIndex}`;
  }

  handleCrossbreedingSaplingSelection(crossbreedingSaplingIndex: number) {
    if (this.map.crossbreedingSaplingsVariants) {
      this.$emit('composing-sapling-selected', this.map.crossbreedingSaplingsVariants[crossbreedingSaplingIndex]);
    }
  }

  handleBaseSaplingSelection() {
    if (this.map.baseSaplingVariants) {
      this.$emit('composing-sapling-selected', this.map.baseSaplingVariants);
    }
  }
}
</script>

<style scoped lang="scss">
.map {
  color: lightgray;
  text-align: center;
  user-select: none;
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
    .map_header-subtitle {
      text-overflow: initial;
    }
    .map_score {
      span {
        font-weight: bold;
        color: white;
      }
    }
    .map_chance span,
    .map_gen {
      font-weight: bold;
    }
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
  .map_base-sapling-container {
    position: relative;
    justify-content: center;
    padding: 5px 0;
    display: flex;
  }
  .map_sapling-list {
    position: relative;
    display: flex;
    justify-content: center;
  }
  .map_sapling {
    font-size: 1rem;
    outline: 0px solid rgba(223, 145, 0, 0.3);
  }
  .map_sapling--selectable {
    transition: outline-color 0.15s;
    user-select: none;
    outline: 2px solid rgba(223, 145, 0, 0.3);
    outline-offset: 2px;
  }
  .map_sapling--selectable:hover {
    outline: 2px solid rgba(223, 145, 0, 0.8);
    cursor: pointer;
  }
  .map_sapling--selectable:active {
    outline: 2px solid rgb(223, 145, 1);
  }
  .map_result-sapling {
    background-color: #191919;
    padding: 5px 0;
  }
  .map_sapling-generation,
  .map_sapling-chance {
    position: absolute;
    display: inline-block;
    font-size: 0.7em;
    top: 0.75em;
    user-select: none;

    &.map_sapling-generation--subtle {
      opacity: 0.3;
    }
  }
  .map_sapling-generation {
    left: -0.5em;
    &.map_sapling-generation--subtle {
      opacity: 0.3;
    }
  }
  .map_sapling-chance {
    right: 0;
    width: 2.6em;
    text-align: left;
    &.map_sapling-chance--subtle {
      opacity: 0.3;
    }
    &.map_sapling-chance--moderate {
      color: rgb(223, 145, 0);
    }
  }
}
</style>
