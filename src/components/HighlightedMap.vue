<template>
  <div class="d-flex flex-column align-center">
    <SimulationMap
      :map="map"
      enable-tooltip
      enable-composing-saplings-selection
      enable-geographical-direction-tips
      @composing-sapling-selected="handleHighlightComposingSaplingSelectedEvent"
    />
    <v-btn class="mt-3" @click="handleClearHighlightClick">Clear Selection</v-btn>
    <div class="highlighted-map_tip mt-2 mb-2 px-3 px-sm-0" v-if="map && map.chance < 1">
      Place plants with an "E" next to the <v-icon size="large">mdi-compass-rose</v-icon> icon in the eastern most slots
      of the planter box, and plants with a "W" in the western most slots to influence the crossbreeding for the desired
      result.
      <a
        class="float-right ml-2"
        href="https://discord.com/channels/959797097895460885/995943791494172714/1148151452083163156"
        target="_blank"
        >learn more</a
      >
    </div>
    <v-divider
      class="highlighted-map_tip-divider"
      v-if="map && map.resultSapling.generationIndex > 1 && map.chance < 1"
    ></v-divider>
    <div class="highlighted-map_tip mt-2 mb-2 px-3 px-sm-0" v-if="map && map.resultSapling.generationIndex > 1">
      The Sapling you selected comes from the
      <strong>{{ map.resultSapling.generationIndex === 2 ? '2nd' : '3rd' }}</strong> generation. You will first need to
      crossbreed Saplings that it requires. Click on
      <span class="highlighted-map_highlight-guide">highlighted</span> Saplings to see how to crossbreed them.
    </div>
  </div>
</template>

<script lang="ts">
import { GeneticsMapGroup, GeneticsMap } from '@/services/crossbreeding-service/models';
import { Component, Prop, Vue } from 'vue-property-decorator';
import SimulationMap from './SimulationMap.vue';

@Component({ components: { SimulationMap } })
export default class HighlightedMap extends Vue {
  @Prop({ type: GeneticsMap, required: true }) map: GeneticsMap;

  handleClearHighlightClick() {
    this.$emit('clear-highlight-clicked');
  }

  handleHighlightComposingSaplingSelectedEvent(group: GeneticsMapGroup) {
    this.$emit('composing-sapling-selected', group);
  }
}
</script>

<style scoped lang="scss">
.highlighted-map_tip-divider {
  width: 100%;
}
.highlighted-map_tip {
  text-align: justify;
  i {
    opacity: 0.35;
  }
}
.highlighted-map_highlight-guide {
  outline: 2px solid rgba(223, 145, 0, 0.4);
  outline-offset: 2px;
}

.theme--light {
  .highlighted-map_tip {
    i {
      opacity: 0.75;
    }
  }
}
</style>
