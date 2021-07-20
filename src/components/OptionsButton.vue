<template>
  <v-dialog v-model="isDialogOpen" width="500" @click:outside="resetInputs">
    <template v-slot:activator="{ on, attrs }">
      <v-btn v-bind="attrs" v-on="on">
        Options
      </v-btn>
    </template>

    <v-card>
      <v-form v-model="isFormValid">
        <v-card-title class="headline" primary-title>
          <h3>Options</h3>
        </v-card-title>

        <v-card-text>
          <v-container>
            <h3>Gene Scores</h3>
            <v-row>
              <v-col v-for="geneScore in scoreInputs" :key="geneScore.key">
                <v-text-field
                  type="number"
                  :label="geneScore.key"
                  :rules="geneScoreRules"
                  v-model.number="geneScores[geneScore.key]"
                  required
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row class="mt-0">
              <v-checkbox
                class="mx-2"
                v-model="withRepetitions"
                hint="Aditionally checks combinations where one plant is used multiple times in one crossbreeding session. Significantly increases calculation time."
                persistent-hint
                label="Check combinations with repetitions (takes longer, may give better results)"
              />
            </v-row>

            <v-row class="mt-3">
              <v-checkbox
                class="mx-2"
                v-model="includeAllResults"
                hint="By default only results as good as the Source Saplings are included. If checked, even results with bad score are included. Can cause app crash due to insufficient memory."
                persistent-hint
                label="Include all results (memory WARNING!)"
              />
            </v-row>
          </v-container>
        </v-card-text>
        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="closeDialog">
            Close
          </v-btn>

          <v-btn color="primary" text @click="saveOptions" :disabled="!isFormValid">
            Save
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
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
    includeAllResults: false,
    geneScores: {
      [GeneEnum.G]: 1,
      [GeneEnum.Y]: 1,
      [GeneEnum.H]: 0.5,
      [GeneEnum.X]: 0,
      [GeneEnum.W]: -0.2,
      [GeneEnum.B]: 0
    }
  };

  withRepetitions = false;
  includeAllResults = false;

  geneScores: Record<GeneEnum, number> | null = null;

  geneScoreRules = [(v: number) => (v >= -1 && v <= 1) || 'It has to be a number between -1 and 1.'];

  get scoreInputs() {
    return Object.keys(this.geneScores || {})
      .map((key) => ({ key, value: this.geneScores?.[key as GeneEnum] }))
      .filter((item) => item.key !== GeneEnum.B);
  }

  created() {
    this.resetInputs();
  }

  resetInputs() {
    this.withRepetitions = this.options.withRepetitions;
    this.includeAllResults = this.options.includeAllResults;
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
    this.options.includeAllResults = this.includeAllResults;
    Object.keys(this.geneScores || {}).forEach((key) => {
      this.options.geneScores[key as GeneEnum] = this.geneScores?.[key as GeneEnum] || 0;
    });
  }
}
</script>
