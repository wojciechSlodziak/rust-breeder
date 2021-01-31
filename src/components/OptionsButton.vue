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
                  v-model.number="newGeneScores[geneScore.key]"
                  required
                ></v-text-field>
              </v-col>
            </v-row>
          </v-container>
          <v-container>
            <v-row>
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

  includeAllResults = false;

  newGeneScores: Record<GeneEnum, number> | null = null;

  geneScoreRules = [(v: number) => (v >= -1 && v <= 1) || 'It has to be a number between -1 and 1.'];

  get scoreInputs() {
    return Object.keys(this.newGeneScores || {})
      .map((key) => ({ key, value: this.newGeneScores?.[key as GeneEnum] }))
      .filter((item) => item.key !== GeneEnum.B);
  }

  created() {
    this.resetInputs();
  }

  resetInputs() {
    this.includeAllResults = this.options.includeAllResults;
    this.newGeneScores = {
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
    this.options.includeAllResults = this.includeAllResults;
    Object.keys(this.newGeneScores || {}).forEach((key) => {
      this.options.geneScores[key as GeneEnum] = this.newGeneScores?.[key as GeneEnum] || 0;
    });
  }
}
</script>
