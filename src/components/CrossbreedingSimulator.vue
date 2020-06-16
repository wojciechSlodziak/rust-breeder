<template>
  <div class="simulator">
    <!--PROGRESS-->
    <div class="simulator_progress-container">
      <v-progress-linear color="teal" v-if="isSimulating" v-model="progressPercent" stream></v-progress-linear>
    </div>
    <v-container fluid>
      <v-row>
        <v-col cols="12" md="4" class="text-center">
          <v-form ref="form" v-model="isFormValid">
            <!--SUBMIT-->
            <v-btn @click="submit" :disabled="isSimulating || !isFormValid">Simulate</v-btn>

            <!--OPTIONS-->
            <span class="ml-2">
              <OptionsButton ref="optionsButton" />
            </span>

            <!--TEXT AREA-->
            <v-textarea
              label="Source Saplings"
              v-model="saplingGenes"
              outlined
              auto-grow
              validate-on-blur
              :rules="sourceSaplingRules"
              class="mt-5"
              hint="Enter each Sapling's genes in new line using 'XXYWGH' format."
            ></v-textarea>
          </v-form>
        </v-col>

        <!--RESULTS-->
        <v-col cols="12" md="8">
          <SimulationResults v-if="resultMapList && !isSimulating" :mapList="resultMapList" />
          <div class="text-center" v-if="resultMapList !== null && resultMapList.length === 0 && !isSimulating">
            No bueno! You'll need to find more source plants. Try to pick the <strong>good</strong> ones!
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { plainToClass } from 'class-transformer';
import optimizerService, { EventListenerCallbackData } from '../services/optimizer-service/optimizer.service';
import GeneticsMap from '../models/genetics-map.model';
import SimulationResults from './SimulationResults.vue';
import OptionsButton from './OptionsButton.vue';

@Component({
  components: { SimulationResults, OptionsButton }
})
export default class CrossbreedingSimulator extends Vue {
  saplingGenes = 'YGYHYY\nYGGHWX\nXHHYGY\nGGYGWX\nHWXYGG\nGYXHYY\nWHXGWX\nYGHYGY\nHYGYGH';
  progressPercent = 0;
  isSimulating = false;
  isFormValid = false;
  resultMapList: GeneticsMap[] | null = null;

  sourceSaplingRules = [
    (v: string) => v !== '' || 'Give me some plants to work with!',
    (v: string) => /^([GHWYX]{6}\n{1})*([GHWYX]{6}\n{0})*\n*$/.test(v) || 'Blyat, the format is wrong...'
  ];

  constructor() {
    super();
    optimizerService.addEventListener(this.onOptimizerServiceEvent);
  }

  onOptimizerServiceEvent(type: string, data: EventListenerCallbackData) {
    if (type === 'PROGRESS_UPDATE') {
      this.progressPercent = data.progressPercent || 0;
    }
    if (type === 'DONE') {
      this.progressPercent = 100;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.resultMapList = plainToClass(GeneticsMap, data.mapList!) || null;

      setTimeout(() => {
        this.isSimulating = false;
        this.progressPercent = 0;
      }, 200);
    }
    this.$forceUpdate();
  }

  submit() {
    this.saplingGenes = this.saplingGenes.trim();
    this.progressPercent = 0;
    this.resultMapList = null;
    optimizerService.simulateBestGenetics(this.saplingGenes, (this.$refs.optionsButton as OptionsButton).getOptions());
    this.isSimulating = true;
  }
}
</script>

<style scoped lang="scss">
.simulator_progress-container {
  height: 5px;
}
</style>
