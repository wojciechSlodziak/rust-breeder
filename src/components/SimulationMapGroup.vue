<template>
  <div class="group mx-auto">
    <div class="group_container">
      <div class="group_map-list">
        <div
          class="group_map-container"
          v-for="(map, index) in group.mapList"
          :key="
            (map.baseSapling ? map.baseSapling.toString() + '-' : '') +
              map.crossbreedingSaplings.map((sapling) => sapling.toString()).join('')
          "
        >
          <SimulationMap
            @click.native="handleMapClick(index)"
            @mouseenter.native="() => index !== 0 && handleBackingMapMouseEnter()"
            @mouseleave.native="handleMouseLeave(index)"
            @pointerleave.native="handleMouseLeave(index)"
            @touchmove.native="handleMouseLeave(index)"
            @mousedown.native="() => index === 0 && handleMouseDown()"
            @pointerdown.native="() => index === 0 && handleMouseDown()"
            @mouseup.native="() => index === 0 && handleMouseUp()"
            @pointerup.native="() => index === 0 && handleMouseUp()"
            :ref="index === 0 ? 'primaryMap' : null"
            class="group_map"
            :class="{
              'group_map--backing': index !== 0,
              'group_map--highlighted': map === highlightedMap,
              'group_map--backing-hovered': index !== 0 && isMouseHoveringBackingMap
            }"
            :key="
              (map.baseSapling ? map.baseSapling.toString() + '-' : '') +
                map.crossbreedingSaplings.map((sapling) => sapling.toString()).join('')
            "
            :map="map"
            enable-map-selection
            :enable-ripple="index === 0"
            :enable-tooltip="index === 0"
            :forced-height="index !== 0 ? backingMapHeight : null"
            :style="{
              'z-index': group.mapList.length - index
            }"
          />
        </div>
      </div>
    </div>
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

  backingMapHeight = 0;

  isLongPressingMap = false;
  isMouseHoveringBackingMap = false;

  get hasBrowsingMessageSlotContent() {
    return this.$slots.browsingMessage;
  }

  mounted() {
    this.handlePotentialHeightChange();
  }

  updated() {
    this.handlePotentialHeightChange();
  }

  handlePotentialHeightChange() {
    if (this.$refs.primaryMap) {
      this.onNextTickRerender(() => {
        this.backingMapHeight = (this.$refs.primaryMap as Vue[])[0].$el.getBoundingClientRect().height;
      });
    }
  }

  handleMapClick(index: number) {
    if (index !== 0) {
      this.handleBackingMapClick();
    } else {
      this.handlePrimaryMapClick(this.group.mapList[index]);
    }
  }

  handleBackingMapClick() {
    this.$emit('group-selected', this.group);
  }

  handlePrimaryMapClick(map: GeneticsMap) {
    setTimeout(() => {
      this.$emit('map-selected', map);
    }, 100);
  }

  handleBackingMapMouseEnter() {
    this.isMouseHoveringBackingMap = true;
  }

  handleMouseLeave(index: number) {
    if (index === 0) {
      this.isLongPressingMap = false;
    } else {
      this.isMouseHoveringBackingMap = false;
    }
  }

  handleMouseDown() {
    this.isLongPressingMap = true;
    setTimeout(() => {
      if (this.isLongPressingMap) {
        this.$emit('group-selected', this.group);
      }
    }, 500);
  }

  handleMouseUp() {
    this.isLongPressingMap = false;
  }
}
</script>

<style scoped lang="scss">
.group {
  z-index: 0;
  width: 320px;
  position: relative;
  .group_map {
    transition: transform 0.2s;
    position: relative;
    transform-origin: bottom right;
    &.group_map--backing {
      position: absolute;
      overflow: hidden;
      top: 0;
    }
    &.group_map--highlighted {
      box-shadow: 0px 0px 1px 2px var(--v-cardHighlight-base);
      border: 1px solid var(--v-cardHighlight-base);
    }
  }
  &:hover {
    .group_map-container:nth-child(2) .group_map {
      transform: rotate(9deg);
      &.group_map--backing-hovered {
        transition: transform 0.1s;
        transform: rotate(13deg);
      }
    }
    .group_map-container:nth-child(3) .group_map {
      transform: rotate(18deg);
      &.group_map--backing-hovered {
        transition: transform 0.1s;
        transform: rotate(26deg);
      }
    }
  }
}
</style>
