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
              ref="saplingGenesInput"
              label="Source Saplings"
              :value="saplingGenes"
              @input="handleSaplingGenesInput($event)"
              outlined
              auto-grow
              validate-on-blur
              :rules="sourceSaplingRules"
              autocomplete="off"
              class="mt-5"
              hint="Enter each Sapling's genes in new line using 'XXYWGH' format."
            ></v-textarea>
          </v-form>
        </v-col>

        <!--RESULTS-->
        <v-col cols="12" md="8">
          <SimulationResults
            v-if="resultMapGroups !== null && resultMapGroups.length !== 0 && !isSimulating"
            :mapGroups="resultMapGroups"
            :highlightedMap="highlightedMap"
            v-on:select:map="handleSelectMapEvent"
          />
          <div
            class="text-center py-md-6"
            v-if="resultMapGroups !== null && resultMapGroups.length === 0 && !isSimulating"
          >
            No bueno! You'll need to find more source plants. Try to pick the <strong>good</strong> ones!
          </div>
          <div class="text-center py-md-6" v-if="showNotEnoughSaplingsError">
            No bueno! More plants are needed to crossbreed!
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import optimizerService from '../services/optimizer-service/optimizer.service';
import SimulationResults from './SimulationResults.vue';
import OptionsButton from './OptionsButton.vue';
import { EventListenerCallbackData, MapGroup, NotEnoughSourceSaplingsError } from '@/services/optimizer-service/models';
import GeneticsMap from '@/models/genetics-map.model';

@Component({
  components: { SimulationResults, OptionsButton }
})
export default class CrossbreedingSimulator extends Vue {
  saplingGenes = `GGYXHW
WGYXGH
XYHWGW
YGHWYH
XGGWYW
XGYXXW
WHGXGY
XWGYHH
XYGWGX
XHGWYH
WHYYGW
WYWWGX
WYGXWX
YYHXGW
XGXYYW
XXGXHY
WWGYYH`;
  progressPercent = 0;
  isSimulating = false;
  isFormValid = false;
  showNotEnoughSaplingsError = false;
  highlightedMap: GeneticsMap | null = null;
  resultMapGroups: readonly MapGroup[] | null = null;

  sourceSaplingRules = [
    (v: string) => v !== '' || 'Give me some plants to work with!',
    (v: string) => /^([GHWYX]{6}\n{1})*([GHWYX]{6}\n{0})*\n*$/.test(v) || 'The format is wrong...'
  ];

  constructor() {
    super();
    optimizerService.addEventListener(this.onOptimizerServiceEvent);
  }

  handleSaplingGenesInput(value: string) {
    this.showNotEnoughSaplingsError = false;
    const textarea = (this.$refs.saplingGenesInput as Vue).$el.querySelector('textarea');
    if (textarea) {
      const caretPosition = textarea.selectionStart;
      this.saplingGenes = value;
      this.$nextTick(() => {
        this.saplingGenes = value.toUpperCase().replace(/[^GHWYX\n]/g, '');
        this.$nextTick(() => {
          textarea.selectionEnd = caretPosition + (this.saplingGenes.length - value.length);
        });
      });
    }
  }

  onOptimizerServiceEvent(type: string, data: EventListenerCallbackData) {
    if (type === 'PROGRESS_UPDATE') {
      this.progressPercent = data.progressPercent || 0;
    }
    if (type === 'DONE') {
      this.progressPercent = 100;
      this.resultMapGroups = Object.freeze(data.mapGroups || null);

      console.log(this.resultMapGroups);
      setTimeout(() => {
        this.isSimulating = false;
        this.progressPercent = 0;
      }, 200);
    }
    this.$forceUpdate();
  }

  submit() {
    const splitSaplingGenes: string[] = this.saplingGenes.trim().split(/\r?\n/);
    const deduplicatedSaplingGenes: string[] = splitSaplingGenes.filter(
      (genes, index, self) => index === self.findIndex((otherGenes) => otherGenes === genes)
    );
    this.saplingGenes = deduplicatedSaplingGenes.join('\n');

    this.progressPercent = 0;
    this.resultMapGroups = null;
    try {
      optimizerService.simulateBestGenetics(
        deduplicatedSaplingGenes,
        (this.$refs.optionsButton as OptionsButton).getOptions()
      );
      this.isSimulating = true;
    } catch (e) {
      if (e instanceof NotEnoughSourceSaplingsError) {
        this.showNotEnoughSaplingsError = true;
      }
    }
  }

  handleSelectMapEvent(map: GeneticsMap) {
    this.highlightedMap = map;
  }
}
</script>

<style scoped lang="scss">
.simulator_progress-container {
  height: 5px;
}
</style>
