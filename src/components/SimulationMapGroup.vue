<template>
  <div
    class="group mx-auto"
    :class="{ 'group--normal-mode': !isGroupBrowsingMode, 'group--browsing-mode': isGroupBrowsingMode }"
  >
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
      <div class="group_map-list">
        <div
          class="group_map-container"
          v-for="(map, index) in group.mapList"
          :key="
            (map.baseSapling ? map.baseSapling.toString() + '-' : '') +
              map.crossbreedSaplings.map((sapling) => sapling.toString()).join('')
          "
        >
          <div v-if="isGroupBrowsingMode" class="group_map-label mb-1">{{ `Option ${index + 1}` }}</div>
          <SimulationMap
            @click.native="enableSelection && handleMapClick(map, index !== 0 && !isGroupBrowsingMode)"
            @mouseenter.native="() => index !== 0 && !isGroupBrowsingMode && handleDummyMouseEnter()"
            @mouseleave.native="handleMouseLeave(index)"
            @pointerleave.native="handleMouseLeave(index)"
            @mousedown.native="() => index === 0 && handleMouseDown()"
            @pointerdown.native="() => index === 0 && handleMouseDown()"
            @mouseup.native="() => index === 0 && handleMouseUp()"
            @pointerup.native="() => index === 0 && handleMouseUp()"
            @composing-sapling-selected="handleComposingSaplingSelectedEvent"
            :ref="index === 0 ? 'mainMap' : null"
            class="group_map"
            :class="{
              'group_map--dummy': index !== 0 && !isGroupBrowsingMode,
              'group_map--highlighted': map === highlightedMap,
              'group_map--dummy-hovered': index !== 0 && isMouseHoveringDummy
            }"
            :key="
              (map.baseSapling ? map.baseSapling.toString() + '-' : '') +
                map.crossbreedSaplings.map((sapling) => sapling.toString()).join('')
            "
            :map="map"
            :is-dummy="index !== 0 && !isGroupBrowsingMode"
            :enable-map-selection="enableSelection"
            :label="isGroupBrowsingMode ? `Option ${index + 1}` : null"
            :enable-composing-saplings-selection="enableComposingSaplingsSelection"
            :forced-height="index !== 0 ? dummyHeight : null"
            :style="{
              'z-index': maxDisplayedMaps - index
            }"
          />
        </div>
      </div>
    </div>
    <v-overlay :value="isGroupBrowsingMode" z-index="6" opacity="0.9" @click.native="handleOverlayClick"></v-overlay>
  </div>
</template>

<script lang="ts">
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

  dummyHeight = 0;
  maxDisplayedMaps = 3;

  isGroupBrowsingMode = false;
  isLongPressingMap = false;
  isMouseHoveringDummy = false;
  applyOverflowInBrowsingMode = false;

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

  handleDummyMouseEnter() {
    this.isMouseHoveringDummy = true;
  }

  handleMouseLeave(index: number) {
    if (index === 0) {
      this.isLongPressingMap = false;
    } else {
      this.isMouseHoveringDummy = false;
    }
  }

  handleMouseDown() {
    this.isLongPressingMap = true;
    setTimeout(() => {
      if (this.isLongPressingMap) {
        this.openBrowsingMode();
      }
    }, 500);
  }

  handleMouseUp() {
    this.isLongPressingMap = false;
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
    this.isLongPressingMap = false;
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
  user-select: none;
  &.group--normal-mode {
    .group_map {
      transition: transform 0.2s;
    }
    &:hover {
      .group_map-container:nth-child(2) .group_map {
        transform: rotate(9deg);
        &.group_map--dummy-hovered {
          transition: transform 0.1s;
          transform: rotate(13deg);
        }
      }
      .group_map-container:nth-child(3) .group_map {
        transform: rotate(18deg);
        &.group_map--dummy-hovered {
          transition: transform 0.1s;
          transform: rotate(26deg);
        }
      }
    }
  }
  .group_map {
    position: relative;
    transform-origin: bottom right;
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
      .group_map-container {
        position: relative;
        display: inline-block;
        vertical-align: top;
      }
      .group_map-container:not(:first-child) {
        margin-left: 20px;
      }
      .group_map-label {
        text-align: center;
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
