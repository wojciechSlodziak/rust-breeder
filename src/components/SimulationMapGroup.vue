<template>
  <div class="group mx-auto" :class="{ 'group--browsing-mode': isGroupBrowsingMode }">
    <div class="group_container">
      <SimulationMap
        @click.native="handleMapClick(index !== 0 && !isGroupBrowsingMode)"
        @mouseover.native="(e) => index !== 0 && !isGroupBrowsingMode && handleDummyMouseOver(e)"
        @mouseout.native="(e) => index !== 0 && !isGroupBrowsingMode && handleDummyMouseOut(e)"
        ref="map"
        class="group_map"
        v-for="(map, index) in displayedMaps"
        :key="index"
        :map="map"
        :isDummy="index !== 0 && !isGroupBrowsingMode"
        :forced-height="index !== 0 ? dummyHeight : null"
        :style="{
          'z-index': maxDisplayedMaps - index,
          opacity:
            !isGroupBrowsingMode && index !== 0
              ? ((maxDisplayedMaps - index) / maxDisplayedMaps) * (isMouseHoveringDummy ? 1 : 0.6)
              : 1,
          transform: !isGroupBrowsingMode ? 'translateX(' + index * (isMouseHoveringDummy ? 20 : 15) + 'px)' : 'none'
        }"
      />
    </div>
    <v-overlay :value="isGroupBrowsingMode" z-index="6" opacity="0.8" @click.native="handleOverlayClick"></v-overlay>
  </div>
</template>

<script lang="ts">
import { MapGroup } from '@/services/optimizer-service/optimizer.helper';
import { Component, Vue, Prop } from 'vue-property-decorator';
import SimulationMap from './SimulationMap.vue';

@Component({
  components: { SimulationMap }
})
export default class SimulationMapGroup extends Vue {
  @Prop({ type: Object, required: true }) readonly group!: MapGroup;

  dummyHeight = 0;
  maxDisplayedMaps = 5;

  isGroupBrowsingMode = false;
  isMouseHoveringDummy = false;

  get displayedMaps() {
    return [...this.group.mapList].splice(0, this.maxDisplayedMaps);
  }

  mounted() {
    if (this.$refs.map) {
      Vue.nextTick(() => {
        this.dummyHeight = (this.$refs.map as Vue[])[0].$el.getBoundingClientRect().height;
      });
    }
  }

  handleMapClick(isDummy: boolean) {
    if (isDummy) {
      this.handleDummyClick();
    } else {
      this.handleHighlightMapClick();
    }
  }

  handleDummyClick() {
    this.isGroupBrowsingMode = true;
  }

  handleHighlightMapClick() {
    this.isGroupBrowsingMode = false;
  }

  handleDummyMouseOver() {
    this.isMouseHoveringDummy = true;
  }

  handleDummyMouseOut() {
    this.isMouseHoveringDummy = false;
  }

  handleOverlayClick() {
    this.isGroupBrowsingMode = false;
  }
}
</script>

<style scoped lang="scss">
.group {
  z-index: 0;
  width: 320px;
  position: relative;
  .group_map {
    position: relative;
  }
  .group_map:not(:first-child) {
    position: absolute;
    cursor: pointer;
    top: 0;
    transition: all 0.15s;
  }
  &.group--browsing-mode {
    position: fixed;
    z-index: 1;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    .group_container {
      z-index: 7;
      position: relative;
      white-space: nowrap;
      overflow-x: auto;
      padding: 20px;
      .group_map {
        position: relative;
        display: inline-block;
        vertical-align: middle;
      }
      .group_map:not(:first-child) {
        margin-left: 20px;
      }
    }
  }
}
</style>
