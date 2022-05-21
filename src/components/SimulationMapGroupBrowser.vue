<template>
  <div
    class="group mx-auto"
    v-if="visibleGroup !== null"
    @click="handleOverlayClick"
    :class="[animationClass, { 'group--visible': isVisible, 'group--overflow': applyOverflow }]"
  >
    <div class="group_container" ref="scrollContainer">
      <div class="group_helper-text-container" v-if="visibleGroup && visibleGroup.mapList.length > 1">
        <div class="group_helper-text text-center pl-2 pr-2 d-none d-sm-block">
          Here you can see all the different ways you can crossbreed the same selected Sapling.
          <div v-if="hasMessageSlotContent">
            <v-divider class="mt-2 mb-2"></v-divider>
            <slot name="message"></slot>
          </div>
        </div>
      </div>
      <div class="group_map-list">
        <div
          class="group_map-container"
          v-for="(map, index) in visibleGroup ? visibleGroup.mapList : []"
          :key="
            (map.baseSapling ? map.baseSapling.toString() + '-' : '') +
              map.crossbreedSaplings.map((sapling) => sapling.toString()).join('')
          "
        >
          <div class="group_map-label mb-1" v-if="visibleGroup && visibleGroup.mapList.length > 1">
            {{ `${index === 0 ? 'Best' : 'Alternative'} Option ${index > 0 ? index + 1 : ''}` }}
          </div>
          <SimulationMap
            @click.native.stop="enableMapSelection && handleMapClick(map)"
            @composing-sapling-selected="handleComposingSaplingSelectedEvent"
            class="group_map"
            :class="{
              'group_map--highlighted': map === highlightedMap
            }"
            :key="
              (map.baseSapling ? map.baseSapling.toString() + '-' : '') +
                map.crossbreedSaplings.map((sapling) => sapling.toString()).join('')
            "
            :map="map"
            :enable-ripple="enableMapSelection"
            :enable-map-selection="enableMapSelection"
            :enable-composing-saplings-selection="enableComposingSaplingsSelection"
          />
        </div>
      </div>
    </div>
    <v-overlay z-index="6" opacity="0.95" :value="isVisible"></v-overlay>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import SimulationMap from './SimulationMap.vue';
import { GeneticsMapGroup, GeneticsMap } from '@/services/optimizer-service/models';

@Component({
  components: { SimulationMap }
})
export default class SimulationMapGroupBrowser extends Vue {
  @Prop({ type: Object }) readonly group: GeneticsMapGroup | null;
  @Prop({ type: Object }) readonly group2: GeneticsMapGroup | null;
  @Prop({ type: Object }) readonly highlightedMap: GeneticsMap | null;
  @Prop({ type: Boolean }) readonly enableMapSelection: boolean;
  @Prop({ type: Boolean }) readonly enableComposingSaplingsSelection: boolean;

  @Watch('group')
  onGroupPropertyChanged(value: GeneticsMapGroup | null) {
    if (value) {
      this.visibleGroup = value;
      this.$nextTick(() => {
        this.isVisible = true;
        this.animationClass = 'group--animate-slide-to-center';
        setTimeout(() => {
          this.applyOverflow = true;
        }, 300);
      });
    } else {
      this.isVisible = false;
      this.animationClass = null;
      this.applyOverflow = false;
      setTimeout(() => {
        this.visibleGroup = null;
      }, 300);
    }
  }

  @Watch('group2')
  onGroup2PropertyChanged(value: GeneticsMapGroup | null) {
    if (value) {
      this.animationClass = 'group--animate-slide-to-left';
      (this.$refs.scrollContainer as HTMLElement).scrollLeft = 0;
      this.applyOverflow = false;
      setTimeout(() => {
        this.animationClass = null;
        this.visibleGroup = value;
        this.$nextTick(() => {
          this.animationClass = 'group--animate-slide-to-center';
          setTimeout(() => {
            this.applyOverflow = true;
          }, 300);
        });
      }, 300);
    } else {
      this.animationClass = null;
      this.applyOverflow = false;
      setTimeout(() => {
        this.animationClass = 'group--animate-slide-to-left';
        this.visibleGroup = this.group;
        this.$nextTick(() => {
          this.animationClass = 'group--animate-slide-to-center';
          setTimeout(() => {
            this.applyOverflow = true;
          }, 300);
        });
      }, 300);
    }
  }

  visibleGroup: GeneticsMapGroup | null = null;
  animationClass: string | null = null;
  isVisible = false;
  applyOverflow = false;

  get hasMessageSlotContent() {
    return this.$slots.message;
  }

  handleMapClick(map: GeneticsMap) {
    setTimeout(() => {
      this.$emit('map-selected', map);
    }, 200);
  }

  handleComposingSaplingSelectedEvent(group: GeneticsMapGroup) {
    this.$emit('composing-sapling-selected', group);
  }

  handleOverlayClick() {
    this.$emit('leave-group-browsing');
  }
}
</script>

<style scoped lang="scss">
.group {
  display: flex;
  position: fixed;
  z-index: 1;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
  opacity: 0;
  &.group--visible {
    opacity: 1;
  }
  &.group--overflow {
    .group_container {
      overflow-x: auto;
      overflow-x: overlay;
    }
  }

  .group_map-container {
    position: relative;
    display: inline-block;
    vertical-align: top;
    transition: all 0.3s;
    &:nth-child(1) {
      opacity: 0;
      transform: translateX(1000px);
    }
    &:nth-child(2) {
      opacity: 0;
      transform: translateX(1000px);
    }
    &:nth-child(3) {
      opacity: 0;
      transform: translateX(1000px);
    }
  }
  &.group--animate-slide-to-center {
    .group_map-container:nth-child(1) {
      opacity: 1;
      transform: translateX(0);
    }
    .group_map-container:nth-child(2) {
      opacity: 1;
      transition-delay: 50ms;
      transform: translateX(0);
    }
    .group_map-container:nth-child(3) {
      transition-delay: 100ms;
      opacity: 1;
      transform: translateX(0);
    }
  }
  &.group--animate-slide-to-left {
    .group_map-container:nth-child(1) {
      opacity: 0;
      transform: translateX(-1000px);
    }
    .group_map-container:nth-child(2) {
      opacity: 0;
      transition-delay: 50ms;
      transform: translateX(-1000px);
    }
    .group_map-container:nth-child(3) {
      opacity: 0;
      transition-delay: 100ms;
      transform: translateX(-1000px);
    }
  }
  .group_container {
    z-index: 7;
    position: relative;
    white-space: nowrap;
    padding: 20px;
    max-width: 100%;
    .group_map-container:not(:first-child) {
      margin-left: 20px;
    }
    .group_map-container:last-child {
      margin-right: 20px;
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
  .group_map {
    position: relative;
    transform-origin: bottom right;
    &.group_map--highlighted {
      box-shadow: 0px 0px 1px 2px white;
      border: 1px solid white;
    }
  }
}
</style>
