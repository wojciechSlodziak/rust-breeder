<template>
  <div class="group mx-auto" :class="{ 'group--browsing-mode': isGroupBrowsingMode }">
    <div
      v-if="normalViewMode || isGroupBrowsingMode"
      class="group_container"
      :class="{ 'group_container--overflowed': applyOverflowInBrowsingMode }"
    >
      <div class="group_helper-text-container" v-if="isGroupBrowsingMode && group.mapList.length > 1">
        <div class="group_helper-text text-center pl-2 pr-2 d-none d-sm-block">
          Here you can see all the different ways you can crossbreed the same selected Sapling.
          <div v-if="hasBrowsingMessageSlotContent">
            <v-divider class="mt-2 mb-2"></v-divider>
            <slot name="browsingMessage"></slot>
          </div>
        </div>
      </div>
      <SimulationMap
        v-for="(map, index) in visibleMaps"
        @click.native="enableSelection && handleMapClick(map, index !== 0 && !isGroupBrowsingMode)"
        @mouseover.native="() => index !== 0 && !isGroupBrowsingMode && handleDummyMouseOver()"
        @mouseout.native="() => index !== 0 && !isGroupBrowsingMode && handleDummyMouseOut()"
        @composing-sapling-selected="handleComposingSaplingSelectedEvent"
        :ref="index === 0 ? 'mainMap' : null"
        class="group_map"
        :class="{
          'group_map--dummy': index !== 0 && !isGroupBrowsingMode,
          'group_map--highlighted': map === highlightedMap
        }"
        :key="
          (map.baseSapling ? map.baseSapling.toString() + '-' : '') +
            map.crossbreedSaplings.map((sapling) => sapling.toString()).join('')
        "
        :map="map"
        :is-dummy="index !== 0 && !isGroupBrowsingMode"
        :enable-map-selection="enableSelection"
        :enable-composing-saplings-selection="enableComposingSaplingsSelection"
        :forced-height="index !== 0 ? dummyHeight : null"
        :style="{
          'z-index': maxDisplayedMaps - index,
          opacity:
            !isGroupBrowsingMode && index !== 0 && map !== highlightedMap
              ? ((maxDisplayedMaps - index) / maxDisplayedMaps) * (isMouseHoveringDummy ? 1 : 0.75)
              : 1,
          transform: !isGroupBrowsingMode ? 'translateX(' + index * (isMouseHoveringDummy ? 20 : 15) + 'px)' : 'none'
        }"
      />
    </div>
    <v-overlay :value="isGroupBrowsingMode" z-index="6" opacity="0.9" @click.native="handleOverlayClick"></v-overlay>
  </div>
</template>

<script lang="ts">
import { MAX_SAME_RESULT_VARIANTS_IN_MAP } from '../const';
import { Component, Vue, Prop } from 'vue-property-decorator';
import SimulationMap from './SimulationMap.vue';
import { GeneticsMapGroup, GeneticsMap } from '@/services/optimizer-service/models';

@Component({
  components: { SimulationMap }
})
export default class SimulationMapGroup extends Vue {
  @Prop({ type: Object, required: true }) readonly group!: GeneticsMapGroup;
  @Prop({ type: Object }) readonly highlightedMap: GeneticsMap;
  @Prop({ type: Boolean }) readonly groupBrowsingMode: boolean;
  @Prop({ type: Boolean }) readonly normalViewMode: boolean;
  @Prop({ type: Boolean }) readonly enableSelection: boolean;
  @Prop({ type: Boolean }) readonly enableComposingSaplingsSelection: boolean;
  @Prop({ type: Boolean }) readonly displayFrontMapOnly: boolean;

  dummyHeight = 0;
  maxDisplayedMaps = MAX_SAME_RESULT_VARIANTS_IN_MAP;

  isGroupBrowsingMode = false;
  isMouseHoveringDummy = false;
  applyOverflowInBrowsingMode = false;

  get visibleMaps() {
    return this.displayFrontMapOnly ? this.group.mapList.slice(0, 1) : this.group.mapList;
  }

  get hasBrowsingMessageSlotContent() {
    return this.$slots.browsingMessage;
  }

  created() {
    if (this.groupBrowsingMode) {
      this.$nextTick(() => {
        this.openBrowsingMode();
      });
    }
  }

  mounted() {
    this.handlePotentialHeightChange();
  }

  updated() {
    this.handlePotentialHeightChange();
  }

  handlePotentialHeightChange() {
    if (this.$refs.mainMap) {
      this.$nextTick(() => {
        this.dummyHeight = (this.$refs.mainMap as Vue[])[0].$el.getBoundingClientRect().height;
      });
    }
  }

  handleMapClick(map: GeneticsMap, isDummy: boolean) {
    if (isDummy) {
      this.handleDummyClick();
    } else {
      this.handleHighlightMapClick(map);
    }
  }

  handleDummyClick() {
    this.openBrowsingMode();
  }

  handleHighlightMapClick(map: GeneticsMap) {
    setTimeout(() => {
      this.closeBrowsingMode();
      this.$emit('select:map', map);
    }, 100);
  }

  handleDummyMouseOver() {
    this.isMouseHoveringDummy = true;
  }

  handleDummyMouseOut() {
    this.isMouseHoveringDummy = false;
  }

  handleOverlayClick() {
    this.closeBrowsingMode();
  }

  handleComposingSaplingSelectedEvent(group: GeneticsMapGroup) {
    this.$emit('composing-sapling-selected', group);
  }

  openBrowsingMode() {
    this.isMouseHoveringDummy = false;
    this.isGroupBrowsingMode = true;
    this.$emit('open');
    setTimeout(() => {
      this.applyOverflowInBrowsingMode = true;
    }, 200);
  }

  closeBrowsingMode() {
    this.isGroupBrowsingMode = false;
    this.applyOverflowInBrowsingMode = false;
    this.$emit('close');
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
    transition: opacity 0.15s, transform 0.2s;
  }
  .group_map {
    &.group_map--dummy {
      position: absolute;
      overflow: hidden;
      top: 0;
    }
    &.group_map--highlighted {
      box-shadow: 0px 0px 1px 2px white;
      border: 1px solid white;
    }
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
      overflow: hidden;
      padding: 20px;
      &.group_container--overflowed {
        overflow-x: auto;
        overflow-x: overlay;
      }
      .group_map {
        position: relative;
        display: inline-block;
        vertical-align: middle;
      }
      .group_map:not(:first-child) {
        margin-left: 20px;
      }
      &::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }
      &::-webkit-scrollbar-button {
        width: 0px;
        height: 0px;
      }
      &::-webkit-scrollbar-thumb {
        background: #9b9b9b;
        border: 0px none #ffffff;
        border-radius: 50px;
      }
      &::-webkit-scrollbar-thumb:hover {
        background: #8a8a8a;
      }
      &::-webkit-scrollbar-thumb:active {
        background: #5f5f5f;
      }
      &::-webkit-scrollbar-track {
        background: #3b3b3b;
        border: 0px none #ffffff;
        border-radius: 50px;
      }
      &::-webkit-scrollbar-corner {
        background: transparent;
      }
    }
  }
  .group_helper-text-container {
    position: fixed;
    width: 100%;
    left: 0;
    .group_helper-text {
      position: relative;
      top: -20px;
      transform: translateY(-100%);
      white-space: normal;
    }
  }
}
</style>
