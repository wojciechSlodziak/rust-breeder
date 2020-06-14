<template>
  <div>
    <v-textarea
      label="Available Genes"
      v-model="saplingGenes"
      hint="Enter each gene in new line in 'XXYWGH' format"
    ></v-textarea>
    <v-btn @click="submit">go</v-btn>
    <v-progress-linear v-if="progress !== 100" color="teal" v-model="progress" stream></v-progress-linear>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import optimizerService from '../services/optimizer-service/optimizer.service';

@Component
export default class CrossbreedingSimulator extends Vue {
  saplingGenes =
    'YGHYYY\nHYHGHH\nGGGWGH\nHGYYGX\nXYHHYY\nWYYHYH\nXGHGGH\nWYYYYW\nGHYHHW\nHGHXGH\nHYWGHH\nXYHHGH\nHHGXHY\nHGYWYH\nGYHYHW\nHHHWYG\nHGYHGX\nYGHWYH\nWYHHYH\nYYGWHH\nXGHYYX\nHYYGYH';
  progress = 100;

  constructor() {
    super();
    optimizerService.addEventListener(this.onOptimizerServiceEvent);
  }

  onOptimizerServiceEvent(type: string, data: any) {
    if (type === 'PROGRESS_UPDATE') {
      this.progress = data;
    }
    if (type === 'DONE') {
      this.progress = 100;
      console.log(data);
    }
    this.$forceUpdate();
  }

  submit() {
    optimizerService.simulateBestGenetics(this.saplingGenes);
  }
}
</script>

<style scoped lang="scss"></style>
