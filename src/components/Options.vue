<template>
  <v-form v-model="isFormValid">
    <v-dialog v-model="isDialogOpen" width="600" @click:outside="undoChanges">
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
          <v-tooltip top open-delay="0">
            <template v-slot:activator="{ on, attrs }">
              <v-btn v-bind="attrs" text v-on="on" class="ml-auto" color="primary" @click="resetToDefaults">
                Reset
              </v-btn>
            </template>
            <span>Resets options to default values. Don't forget to click Set/Save after.</span>
          </v-tooltip>
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
            hint="Controls how many spots in a planter to use around the Center Sapling. It seems that range from 2 to 5 is a sweet spot between effectiveness and speed. It is possible that we are missing some results if this value is not set to max, but it saves a lot of processing time."
            persistent-hint
          ></v-range-slider>
          <v-slider
            class="mt-8"
            label="Number of Generations"
            v-model.number="options.numberOfGenerations"
            min="1"
            max="3"
            :tick-labels="numberOfGenerationLabels"
            ticks="always"
            tick-size="1"
          ></v-slider>
          <v-text-field
            class="mt-6"
            type="number"
            label="Number of best Saplings added to the next Generation"
            v-model.number="options.numberOfSaplingsAddedBetweenGenerations"
            :rules="numberOfSaplingsAddedBetweenGenerationsRules"
            min="1"
          ></v-text-field>
          <v-checkbox
            class="mt-5"
            v-model="options.withRepetitions"
            label="Check combinations with repetitions"
            hint="Additionally, checks combinations where one plant is used more than once in one crossbreeding session. Slightly increases processing time."
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
                  v-model.number="options.geneScores[geneScore.key]"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-container>
          <v-checkbox
            class="mt-0"
            @change="handleModifyMinimumTrackedScoreManuallyChange"
            v-model="options.modifyMinimumTrackedScoreManually"
            label="Manual Minimum Tracked Score"
            hint="Setting a lower Minimum Tracked Score can increase memory consumption."
            persistent-hint
          />
          <v-text-field
            class="mt-2"
            type="number"
            :disabled="!options.modifyMinimumTrackedScoreManually"
            label="Minimum Tracked Score"
            v-model.number="options.minimumTrackedScore"
            :rules="minimumTrackedScoreRules"
          ></v-text-field>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="handleCloseButtonClick">
            Close
          </v-btn>
          <v-tooltip top open-delay="0">
            <template v-slot:activator="{ on, attrs }">
              <v-btn v-bind="attrs" v-on="on" class="ml-2" color="primary" @click="setOptions" :disabled="!isFormValid">
                Set
              </v-btn>
            </template>
            <span>Sets the selected options for as long as the App is open.</span>
          </v-tooltip>
          <v-tooltip top open-delay="0" v-if="cookiesAccepted">
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                v-bind="attrs"
                v-on="on"
                class="ml-2"
                color="primary"
                @click="saveOptions"
                :disabled="!isFormValid"
              >
                Save
              </v-btn>
            </template>
            <span>Sets and remembers the selected options for the next time you use the App.</span>
          </v-tooltip>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-form>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import GeneEnum from '../enums/gene.enum';
import ApplicationOptions from '../interfaces/application-options';
import { getCookie, setCookie } from 'typescript-cookie';

/**
 * This property is used to version the options saved in the cookies.
 * If the structure of the options would change in the future this value should be incremented
 * to invalidate obsolote options saved by the User.
 */
const OPTIONS_VERSION = 1;
const OPTIONS_COOKIE_KEY = `options-v${OPTIONS_VERSION}`;
const DEFAULT_OPTIONS: ApplicationOptions = {
  withRepetitions: true,
  modifyMinimumTrackedScoreManually: false,
  minCrossbreedingSaplingsNumber: 2,
  maxCrossbreedingSaplingsNumber: 5,
  numberOfGenerations: 2,
  numberOfSaplingsAddedBetweenGenerations: 20,
  minimumTrackedScore: 4,
  geneScores: {
    [GeneEnum.G]: 1,
    [GeneEnum.Y]: 1,
    [GeneEnum.H]: 0.5,
    [GeneEnum.X]: 0,
    [GeneEnum.W]: 0
  }
};
const STORED_OPTIONS = getCookie(OPTIONS_COOKIE_KEY);

@Component
export default class Options extends Vue {
  @Prop({ type: Boolean }) readonly cookiesAccepted: boolean;
  isDialogOpen = false;
  isFormValid = false;

  currentlySetOptions: ApplicationOptions = STORED_OPTIONS
    ? JSON.parse(STORED_OPTIONS)
    : JSON.parse(JSON.stringify(DEFAULT_OPTIONS));
  options: ApplicationOptions = JSON.parse(JSON.stringify(this.currentlySetOptions));

  crossbreedingSaplingsNumberRange = [
    this.options.minCrossbreedingSaplingsNumber,
    this.options.maxCrossbreedingSaplingsNumber
  ];

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
    return Object.keys(this.options.geneScores || {})
      .map((key) => ({ key: key as GeneEnum, value: this.options.geneScores?.[key as GeneEnum] }))
      .filter((item, index) => index < 5);
  }

  get minimumTrackedScoreDerived() {
    const highestGeneScore = Math.max(...Object.values(this.options.geneScores));
    return highestGeneScore * 4;
  }

  handleModifyMinimumTrackedScoreManuallyChange(value: boolean) {
    if (!value) {
      this.options.minimumTrackedScore = this.minimumTrackedScoreDerived;
    }
  }

  handleGeneScoreChange() {
    if (!this.options.modifyMinimumTrackedScoreManually) {
      this.options.minimumTrackedScore = this.minimumTrackedScoreDerived;
    }
  }

  undoChanges() {
    this.options = JSON.parse(JSON.stringify(this.currentlySetOptions));
    this.crossbreedingSaplingsNumberRange = [
      this.currentlySetOptions.minCrossbreedingSaplingsNumber,
      this.currentlySetOptions.maxCrossbreedingSaplingsNumber
    ];
  }

  resetToDefaults() {
    this.options = JSON.parse(JSON.stringify(DEFAULT_OPTIONS));
    this.crossbreedingSaplingsNumberRange = [
      this.options.minCrossbreedingSaplingsNumber,
      this.options.maxCrossbreedingSaplingsNumber
    ];
  }

  getOptions() {
    return this.currentlySetOptions;
  }

  handleCloseButtonClick() {
    this.undoChanges();
    this.isDialogOpen = false;
  }

  setOptions() {
    this.options.minCrossbreedingSaplingsNumber = this.crossbreedingSaplingsNumberRange[0];
    this.options.maxCrossbreedingSaplingsNumber = this.crossbreedingSaplingsNumberRange[1];
    this.currentlySetOptions = JSON.parse(JSON.stringify(this.options));
    this.$emit('options-set', this.currentlySetOptions);
    this.isDialogOpen = false;
  }

  saveOptions() {
    this.setOptions();
    this.storeOptionsInCookie();
    this.isDialogOpen = false;
  }

  storeOptionsInCookie() {
    setCookie(OPTIONS_COOKIE_KEY, JSON.stringify(this.currentlySetOptions), {
      expires: 356 * 5
    });
  }
}
</script>
