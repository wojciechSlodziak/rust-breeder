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
      <v-progress-linear color="cyan" v-model="progressPercents[0]" stream></v-progress-linear>
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
      <v-progress-linear class="mt-1px" color="cyan" v-model="progressPercents[1]" stream></v-progress-linear>
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
      <v-progress-linear class="mt-1px" color="cyan" v-model="progressPercents[2]" stream></v-progress-linear>
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
  height: 5px;
}
.mt-1px {
  margin-top: 1px;
}
</style>
