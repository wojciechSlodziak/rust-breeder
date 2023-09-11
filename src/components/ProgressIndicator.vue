<template>
  <div class="simulator_progress-container">
    <div
      v-if="isActive"
      style="transition: all 0.3s linear 0.2s;"
      :style="{
        transform: progressPercents[0] === 100 ? 'translateY(-4px)' : 'none',
        opacity: progressPercents[0] === 100 ? '0' : '1'
      }"
    >
      <v-progress-linear
        v-if="progressPercents[0] === undefined"
        color="cyan"
        value="0"
        buffer-value="0"
        stream
      ></v-progress-linear>
      <v-progress-linear
        v-if="progressPercents[0] !== undefined"
        color="cyan"
        v-model="progressPercents[0]"
      ></v-progress-linear>
    </div>

    <div
      v-if="isActive && progressPercents.length >= 2"
      style="transition: all 0.3s linear 0.2s;"
      :style="{
        transform:
          'translateY(' + (progressPercents[1] === 100 ? '-10px' : (progressPercents[0] === 100 ? '-5px' : '0') + ')'),
        opacity: progressPercents[1] === 100 ? '0' : '1'
      }"
    >
      <v-progress-linear
        v-if="progressPercents[1] === undefined && progressPercents[0] === 100"
        color="cyan"
        class="mt-1px"
        value="0"
        buffer-value="0"
        stream
      ></v-progress-linear>
      <v-progress-linear
        v-if="progressPercents[1] !== undefined || progressPercents[0] !== 100"
        class="mt-1px"
        color="cyan"
        v-model="progressPercents[1]"
      ></v-progress-linear>
    </div>

    <div
      v-if="isActive && progressPercents.length >= 3"
      style="transition: all 0.3s linear 0.2s;"
      :style="{
        transform:
          'translateY(' +
          (progressPercents[2] === 100
            ? '-15px'
            : progressPercents[1] === 100
            ? '-10px'
            : progressPercents[0] === 100
            ? '-5px'
            : '0') +
          ')',
        opacity: progressPercents[2] === 100 ? '0' : '1'
      }"
    >
      <v-progress-linear
        v-if="progressPercents[2] === undefined && progressPercents[1] === 100"
        color="cyan"
        class="mt-1px"
        value="0"
        buffer-value="0"
        stream
      ></v-progress-linear>
      <v-progress-linear
        v-if="progressPercents[2] !== undefined || progressPercents[1] !== 100"
        class="mt-1px"
        color="cyan"
        v-model="progressPercents[2]"
      ></v-progress-linear>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class ProgressIndicator extends Vue {
  @Prop({ type: Boolean }) readonly isActive: boolean;
  @Prop({ type: Array }) readonly progressPercents: number[];
}
</script>

<style scoped lang="scss">
.simulator_progress-container {
  position: fixed;
  z-index: 4;
  width: 100%;
}
.mt-1px {
  margin-top: 1px;
}
</style>
