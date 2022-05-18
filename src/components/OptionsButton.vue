<template>
  <v-form v-model="isFormValid">
    <v-dialog v-model="isDialogOpen" width="600" @click:outside="resetInputs">
      <template v-slot:activator="{ on, attrs }">
        <v-btn v-bind="attrs" v-on="on">
          Options
          <v-icon right>
            mdi-cog
          </v-icon>
        </v-btn>
      </template>

      <v-card>
        <v-card-title class="headline pl-5 pr-5" primary-title>
          <h2 class="text-h5">Options</h2>
        </v-card-title>
        <v-card-text class="pl-5 pr-5">
          <v-range-slider
            v-model="crossbreedingSaplingsNumberRange"
            min="2"
            max="8"
            :tick-labels="maxCrossbreedingSaplingsLabels"
            ticks="always"
            tick-size="1"
            label="Crossbreeding Saplings Range"
            hint="Controls how many Saplings to use for each Crossbreeding. It seems that range from 2 to 5 is a sweet spot between effectiveness and speed. It is possible that we are missing some results if this value is not set to max (8)."
            persistent-hint
          ></v-range-slider>
          <v-slider
            class="mt-8"
            label="Number of Generations"
            v-model.number="numberOfGenerations"
            min="1"
            max="3"
            :tick-labels="numberOfGenerationLabels"
            ticks="always"
            tick-size="1"
          ></v-slider>
          <v-text-field
            class="mt-6"
            type="number"
            label="Number of best Saplings added to next Generation"
            v-model.number="numberOfSaplingsAddedBetweenGenerations"
            :rules="numberOfSaplingsAddedBetweenGenerationsRules"
            min="1"
          ></v-text-field>
          <v-checkbox
            class="mt-5"
            v-model="withRepetitions"
            label="Check combinations with repetitions"
            hint="Aditionally checks combinations where one plant is used multiple times in one crossbreeding session. Increases calculation time."
            persistent-hint
          />
          <v-container class="mt-10 pa-0">
            <span class="v-label theme--dark">Gene Scores</span>
            <v-row class="pl-2 pr-2">
              <v-col class="pl-1 pr-1" v-for="geneScore in scoreInputs" :key="geneScore.key">
                <v-text-field
                  type="number"
                  :label="geneScore.key"
                  :rules="geneScoreRules"
                  @input="handleGeneScoreChange"
                  v-model.number="geneScores[geneScore.key]"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-container>
          <v-checkbox
            class="mt-0"
            @change="handleModifyMinimumTrackedScoreManuallyChange"
            v-model="modifyMinimumTrackedScoreManually"
            label="Change Minimum Tracked Score"
            hint="Changing Minimum Tracked Score can increase memory consumption."
            persistent-hint
          />
          <v-text-field
            class="mt-2"
            type="number"
            :disabled="!modifyMinimumTrackedScoreManually"
            label="Minimum Tracked Score"
            v-model.number="minimumTrackedScore"
            :rules="minimumTrackedScoreRules"
          ></v-text-field>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="closeDialog">
            Close
          </v-btn>
          <v-btn color="primary" @click="saveOptions" :disabled="!isFormValid">
            Set
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-form>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import GeneEnum from '../enums/gene.enum';
import ApplicationOptions from '../interfaces/application-options';

@Component
export default class OptionsButton extends Vue {
  isDialogOpen = false;
  isFormValid = false;

  options: ApplicationOptions = {
    withRepetitions: true,
    modifyMinimumTrackedScoreManually: false,
    minCrossbreedingSaplingsNumber: 2,
    maxCrossbreedingSaplingsNumber: 5,
    numberOfGenerations: 3, // TODO: set to 2 by default
    numberOfSaplingsAddedBetweenGenerations: 15,
    minimumTrackedScore: 4,
    geneScores: {
      [GeneEnum.G]: 1,
      [GeneEnum.Y]: 1,
      [GeneEnum.H]: 0.5,
      [GeneEnum.X]: 0,
      [GeneEnum.W]: 0,
      [GeneEnum.B]: 0, // not used here but required by TS
      [GeneEnum.MG]: 0, // not used here but required by TS
      [GeneEnum.MA]: 0 // not used here but required by TS
    }
  };

  withRepetitions = this.options.withRepetitions;
  modifyMinimumTrackedScoreManually = this.options.modifyMinimumTrackedScoreManually;
  crossbreedingSaplingsNumberRange = [
    this.options.minCrossbreedingSaplingsNumber,
    this.options.maxCrossbreedingSaplingsNumber
  ];
  numberOfGenerations = this.options.numberOfGenerations;
  numberOfSaplingsAddedBetweenGenerations = this.options.numberOfSaplingsAddedBetweenGenerations;
  minimumTrackedScore = this.options.minimumTrackedScore;
  geneScores: Record<string, number> = {
    ...this.options.geneScores
  };

  numberOfGenerationLabels = ['one', 'two', 'three'];
  maxCrossbreedingSaplingsLabels = ['2', '3', '4', '5', '6', '7', '8'];

  geneScoreRules = [
    (v: number | string) => (v !== '' && v >= -1 && v <= 1) || 'It has to be a number between -1 and 1.'
  ];
  numberOfSaplingsAddedBetweenGenerationsRules = [
    (v: number | string) => (v !== '' && v >= 1 && Number.isInteger(Number(v))) || 'Must be a positive integer.'
  ];
  minimumTrackedScoreRules = [(v: number | string) => (v !== '' && v >= -6 && v <= 6) || `Acceptable range: -6 to 6.`];

  get scoreInputs() {
    return Object.keys(this.geneScores || {})
      .map((key) => ({ key, value: this.geneScores?.[key as GeneEnum] }))
      .filter((item, index) => index < 5);
  }

  get minimumTrackedScoreDerived() {
    const highestGeneScore = Math.max(...Object.values(this.geneScores));
    return highestGeneScore * 4;
  }

  created() {
    this.resetInputs();
  }

  handleModifyMinimumTrackedScoreManuallyChange(value: boolean) {
    if (!value) {
      this.minimumTrackedScore = this.minimumTrackedScoreDerived;
    }
  }

  handleGeneScoreChange() {
    if (!this.modifyMinimumTrackedScoreManually) {
      this.minimumTrackedScore = this.minimumTrackedScoreDerived;
    }
  }

  resetInputs() {
    this.withRepetitions = this.options.withRepetitions;
    this.modifyMinimumTrackedScoreManually = this.options.modifyMinimumTrackedScoreManually;
    this.crossbreedingSaplingsNumberRange = [
      this.options.minCrossbreedingSaplingsNumber,
      this.options.maxCrossbreedingSaplingsNumber
    ];
    this.numberOfGenerations = this.options.numberOfGenerations;
    this.numberOfSaplingsAddedBetweenGenerations = this.options.numberOfSaplingsAddedBetweenGenerations;
    this.minimumTrackedScore = this.options.minimumTrackedScore;
    this.geneScores = {
      ...this.options.geneScores
    };
  }

  getOptions() {
    return this.options;
  }

  closeDialog() {
    this.resetInputs();
    this.isDialogOpen = false;
  }

  saveOptions() {
    this.isDialogOpen = false;
    this.options.withRepetitions = this.withRepetitions;
    this.options.modifyMinimumTrackedScoreManually = this.modifyMinimumTrackedScoreManually;
    this.options.minCrossbreedingSaplingsNumber = this.crossbreedingSaplingsNumberRange[0];
    this.options.maxCrossbreedingSaplingsNumber = this.crossbreedingSaplingsNumberRange[1];
    this.options.numberOfGenerations = this.numberOfGenerations;
    this.options.numberOfSaplingsAddedBetweenGenerations = this.numberOfSaplingsAddedBetweenGenerations;
    this.options.minimumTrackedScore = this.minimumTrackedScore;
    Object.keys(this.geneScores || {}).forEach((key) => {
      this.options.geneScores[key as GeneEnum] = this.geneScores?.[key as GeneEnum] || 0;
    });
  }
}
</script>
