<template>
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
      <v-form v-model="isFormValid">
        <v-card-title class="headline" primary-title>
          <h2 class="text-h5">Options</h2>
        </v-card-title>

        <v-card-text>
          <v-container>
            <h3>Gene Scores</h3>
            <v-row class="mt-0 mx-0">
              <v-col class="pl-1 pr-1 " v-for="geneScore in scoreInputs" :key="geneScore.key">
                <v-text-field
                  type="number"
                  :label="geneScore.key"
                  :rules="geneScoreRules"
                  v-model.number="geneScores[geneScore.key]"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row class="mt-3 mx-0">
              <v-text-field
                type="number"
                label="Max Saplings used for Crossbreeding"
                hint="It is possible that we are missing some results if this value is not set to max (8). Setting it to a lower value speeds the process up extremely though."
                persistent-hint
                :rules="maxCrossbreedingSaplingsRules"
                v-model.number="maxCrossbreedingSaplings"
              ></v-text-field>
            </v-row>
            <v-row class="mt-5">
              <v-checkbox
                class="mx-2"
                v-model="withRepetitions"
                hint="Aditionally checks combinations where one plant is used multiple times in one crossbreeding session. Significantly increases calculation time."
                persistent-hint
                label="Check combinations with repetitions (takes longer, may give better results)"
              />
            </v-row>
            <v-row class="mt-5">
              <v-checkbox
                class="mx-2"
                v-model="includeResultsWithMinimumScore"
                hint="By default only results as good as the Source Saplings are included. If checked, all results with at least minimum score are returned. Can cause app crash due to insufficient memory if you set the value too low."
                persistent-hint
                label="Include results reaching predefined Minimum Score (memory WARNING!)"
              />
            </v-row>
            <v-row class="mt-3 mb-3">
              <v-text-field
                v-if="includeResultsWithMinimumScore"
                class="mx-2"
                type="number"
                label="Minimum Score"
                v-model.number="minimumScore"
                :rules="minimumScoreRules"
              ></v-text-field>
            </v-row>
          </v-container>
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
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { MIN_CROSSBREEDING_SAPLINGS, MAX_CROSSBREEDING_SAPLINGS } from '@/const';
import { Component, Vue } from 'vue-property-decorator';
import GeneEnum from '../enums/gene.enum';
import ApplicationOptions from '../interfaces/application-options';

@Component
export default class OptionsButton extends Vue {
  isDialogOpen = false;
  isFormValid = false;

  options: ApplicationOptions = {
    withRepetitions: true,
    includeResultsWithMinimumScore: false,
    maxCrossbreedingSaplings: 5,
    minimumScore: 2,
    geneScores: {
      [GeneEnum.G]: 1,
      [GeneEnum.Y]: 1,
      [GeneEnum.H]: 0.5,
      [GeneEnum.X]: 0,
      [GeneEnum.W]: -0.2,
      [GeneEnum.B]: 0, // not used here but required by TS
      [GeneEnum.MG]: 0, // not used here but required by TS
      [GeneEnum.MA]: 0 // not used here but required by TS
    }
  };

  withRepetitions = true;
  includeResultsWithMinimumScore = true;
  maxCrossbreedingSaplings = 5;
  minimumScore = 2;
  geneScores: Record<string, number> = {};

  geneScoreRules = [
    (v: number | string) => (v !== '' && v >= -1 && v <= 1) || 'It has to be a number between -1 and 1.'
  ];
  maxCrossbreedingSaplingsRules = [
    (v: number) =>
      (v >= MIN_CROSSBREEDING_SAPLINGS && v <= MAX_CROSSBREEDING_SAPLINGS) ||
      `It has to be a number between ${MIN_CROSSBREEDING_SAPLINGS} and ${MAX_CROSSBREEDING_SAPLINGS}.`
  ];
  minimumScoreRules = [(v: number | string) => v !== '' || 'Value is required.'];

  get scoreInputs() {
    return Object.keys(this.geneScores || {})
      .map((key) => ({ key, value: this.geneScores?.[key as GeneEnum] }))
      .filter((item, index) => index < 5);
  }

  created() {
    this.resetInputs();
  }

  resetInputs() {
    this.withRepetitions = this.options.withRepetitions;
    this.includeResultsWithMinimumScore = this.options.includeResultsWithMinimumScore;
    this.maxCrossbreedingSaplings = this.options.maxCrossbreedingSaplings;
    this.minimumScore = this.options.minimumScore;
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
    this.options.includeResultsWithMinimumScore = this.includeResultsWithMinimumScore;
    this.options.maxCrossbreedingSaplings = this.maxCrossbreedingSaplings;
    this.options.minimumScore = this.minimumScore;
    Object.keys(this.geneScores || {}).forEach((key) => {
      this.options.geneScores[key as GeneEnum] = this.geneScores?.[key as GeneEnum] || 0;
    });
  }
}
</script>
