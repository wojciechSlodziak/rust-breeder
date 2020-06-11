<template>
  <div>
    <textarea v-model="saplingGenes" />
    <button @click="submit">go</button>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import optimizerService from '../services/optimizer-service/optimizer.service';

@Component
export default class CrossbreedingSimulator extends Vue {
  saplingGenes = 'abc';

  submit() {
    optimizerService.simulateBestGenetics(this.saplingGenes);
  }
}
</script>

<style scoped lang="scss"></style>
