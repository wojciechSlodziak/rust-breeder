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
          <span class="map_gen" :class="genClass">GEN.{{ map.resultSapling.generationIndex }}</span>
          <span>&middot;</span>
          <span class="map_score"
            >Score: <span>{{ map.score }}</span></span
          >
          <span>&middot;</span>
          <span class="map_chance" :class="chanceClass"
            >Chance: <span>{{ Math.round(map.chance * 100) }}%</span>
          </span>
        </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
    <v-divider class="mx-4"></v-divider>
    <v-card-text class="map_detail px-0">
      <v-tooltip
        bottom
        open-delay="150"
        :disabled="!enableTooltip || $vuetify.breakpoint.xsOnly"
        z-index="1001"
        max-width="600"
      >
        <template v-slot:activator="{ on, attrs }">
          <div
            class="map_center-sapling-container"
            :class="{ 'map_center-sapling-container--tooltip-enabled': enableTooltip && !$vuetify.breakpoint.xsOnly }"
            v-bind="attrs"
            v-on="on"
          >
            <div class="mb-1">
              Center Sapling:
              <div class="map_center-sapling-info mb-4" v-if="!map.baseSapling">
                <span>any extra plant of same type</span>
              </div>
            </div>
            <SaplingDetailed
              class="mb-4"
              v-if="map.baseSapling"
              :sapling="map.baseSapling"
              :saplingVariants="map.baseSaplingVariants ? map.baseSaplingVariants : undefined"
              :subtleDetails="!enableComposingSaplingsSelection"
              :selectable="enableComposingSaplingsSelection"
              @click="handleBaseSaplingSelection()"
            />
          </div>
        </template>
        <p>
          Sapling that takes the genes from Surrounding Saplings during Crossbreeding stage. Plant it in the center and
          let it grow alone until it reaches about 50% progress in the <strong>Sapling</strong> stage. After that, plant
          the Surrounding Saplings around it.
        </p>
        <p>
          It is always an <strong>extra plant</strong>, so if the app shows <strong>five</strong> Surrounding Saplings
          you will have to plant <strong>six</strong> plants in total.
        </p>
        <p v-if="map.baseSapling">
          You have to plant the exact plant that the app tells you to, otherwise crossbreeding will not work as
          expected.
        </p>
        <p v-if="!map.baseSapling">
          The genes of the plant don't matter. Using one with more Gs will help you finish the process quicker as it
          grows faster.
        </p>
        <p v-if="!map.baseSapling">
          Term "same type" means that if you are crossbreeding yellow berries, then your center seed/clone
          <strong>has to be</strong> a yellow berry and if you are planting potatoes then
          <strong>you have to</strong> plant a potato seed/clone.
        </p>
      </v-tooltip>
      <v-divider class="mb-5"></v-divider>
      <v-tooltip
        bottom
        open-delay="150"
        :disabled="!enableTooltip || $vuetify.breakpoint.xsOnly"
        max-width="600"
        z-index="1001"
      >
        <template v-slot:activator="{ on, attrs }">
          <div v-bind="attrs" v-on="on">
            <div class="mb-1">Surrounding Saplings:</div>
            <ul>
              <li v-for="(crossbreedingSapling, index) in map.crossbreedingSaplings" :key="index">
                <SaplingDetailed
                  :sapling="crossbreedingSapling"
                  :sapling-variants="
                    map.crossbreedingSaplingsVariants ? map.crossbreedingSaplingsVariants[index] : undefined
                  "
                  :subtle-details="!enableComposingSaplingsSelection"
                  :selectable="enableComposingSaplingsSelection"
                  :show-geographical-direction-tip-east="
                    showGeographicalDirectionTips && map.tieWinningCrossbreedingSaplingIndexes
                      ? map.tieWinningCrossbreedingSaplingIndexes.indexOf(index) !== -1
                      : false
                  "
                  :show-geographical-direction-tip-west="
                    showGeographicalDirectionTips && map.tieLosingCrossbreedingSaplingIndexes
                      ? map.tieLosingCrossbreedingSaplingIndexes.indexOf(index) !== -1
                      : false
                  "
                  @click="handleCrossbreedingSaplingSelection(index)"
                />
              </li>
            </ul>
          </div>
        </template>
        <p>
          Saplings that have be planted around the Center Sapling before it goes into
          <strong>Crossbreeding</strong> stage. All Saplings have to be of the same type.
        </p>
        <p>
          {{
            showGeographicalDirectionTips
              ? 'Place your Surrounding Saplings around the Center Sapling according to the EAST/WEST guidance.'
              : 'It does not matter where you place your Surrounding Saplings if your Center Sapling is in the middle of the planter.'
          }}
          Center Sapling will reach horizontally, vertically and diagonally during the crossbreeding phase. You are
          allowed to use any and all of the eight remaining planter slots to plant your Surrounding Saplings.
        </p>
      </v-tooltip>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { GeneticsMap } from '@/services/crossbreeding-service/models';
import { Component, Vue, Prop } from 'vue-property-decorator';
import SaplingGeneRepresentation from './SaplingGeneRepresentation.vue';
import SimulationMapGroup from './SimulationMapGroup.vue';
import SaplingDetailed from './SaplingDetailed.vue';

@Component({
  components: { SaplingGeneRepresentation, SimulationMapGroup, SaplingDetailed }
})
export default class SimulationMap extends Vue {
  @Prop({ type: Object, required: true }) readonly map!: GeneticsMap;
  @Prop({ type: Boolean }) readonly enableComposingSaplingsSelection: boolean;
  @Prop({ type: Boolean }) readonly enableMapSelection: boolean;
  @Prop({ type: Boolean }) readonly enableGeographicalDirectionTips: boolean;
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

  get showGeographicalDirectionTips() {
    return this.enableGeographicalDirectionTips && this.map.chance < 1;
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
  }
  .map_header {
    .map_header-subtitle {
      text-overflow: initial;
      display: flex;
      justify-content: space-evenly;
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
      color: $c-color-red;
    }
    .map_chance--moderate span,
    .map_gen--2 {
      color: $c-color-dark-orange;
    }
    .map_chance--high span,
    .map_gen--1 {
      color: $c-color-light-green;
    }
  }
  .map_sapling {
    font-size: 1rem;
    outline: 0px solid rgba(223, 145, 0, 0.3);
  }
  .map_center-sapling-info {
    font-weight: bold;
    color: white;
  }
  .map_result-sapling {
    background-color: #191919;
    padding: 5px 0;
  }
  &:hover {
    .map_center-sapling-container.map_center-sapling-container--tooltip-enabled {
      .map_center-sapling-info span {
        border-bottom: 1px dashed white;
      }
    }
  }
}
.theme--light .map {
  background-color: #f5f5f5;
  .map_result-sapling {
    background-color: #e9e9e9;
  }
  .map_score {
    span {
      color: inherit;
    }
  }
  .map_center-sapling-info {
    color: inherit;
  }
  &:hover {
    .map_center-sapling-container.map_center-sapling-container--tooltip-enabled {
      .map_center-sapling-info span {
        border-bottom: 1px dashed rgba(0, 0, 0, 0.6);
      }
    }
  }
}
</style>
