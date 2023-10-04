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
        <v-card-title class="headline px-3 px-sm-5" primary-title>
          <h2 class="text-h5">Options</h2>
          <v-tooltip top open-delay="400" z-index="1001" max-width="600">
            <template v-slot:activator="{ on, attrs }">
              <v-btn v-bind="attrs" text v-on="on" class="ml-auto" color="primary" @click="resetToDefaults">
                Reset
              </v-btn>
            </template>
            <span>Resets options to default values. Don't forget to click Set/Save after.</span>
          </v-tooltip>
        </v-card-title>

        <v-tabs v-model="tab">
          <v-tab>Crossbreeding</v-tab>
          <v-tab>UI & Sounds</v-tab>
        </v-tabs>
        <v-divider></v-divider>

        <v-card-text class="px-0">
          <v-tabs-items v-model="tab">
            <v-tab-item class="px-5">
              <v-slider
                class="mt-8"
                label="Number of Workers"
                v-model.number="options.numberOfWorkers"
                min="1"
                :max="maxNumberOfWorkers"
                ticks="always"
                :tick-labels="numberOfWorkersLabels"
                hint="Controls how many background workers are spawned during the calculation. A higher number means the calculation will be finished quicker, but it may cause your processor to be overloaded. If your device is struggling just lower the number."
                persistent-hint
              ></v-slider>
              <v-range-slider
                class="mt-5"
                v-model="crossbreedingSaplingsNumberRange"
                min="2"
                max="8"
                :tick-labels="maxCrossbreedingSaplingsLabels"
                ticks="always"
                tick-size="2"
                label="Crossbreeding Saplings Range"
                hint="Controls the range of Saplings that can be used for a single Crossbreeding session. It seems that range from 2 to 5 is a sweet spot between effectiveness and calculation speed. It is possible that we are missing some results if this value is not set to the extremes, but it saves a lot of processing time."
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
                tick-size="2"
              ></v-slider>
              <v-text-field
                class="mt-6"
                type="number"
                label="Saplings added to next Generation"
                hint="Number of best result Saplings from current Generation that are added to calculation for next Generation."
                persistent-hint
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
                <span class="v-label">Gene Scores</span>
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
            </v-tab-item>

            <v-tab-item class="px-5">
              <v-switch
                v-model="options.darkMode"
                :label="`Switch to ${!options.darkMode ? 'Dark' : 'Light'} Mode`"
                @change="handleUIModeChange"
              ></v-switch>
              <v-switch
                class="mt-0"
                v-model="options.sounds"
                :label="`Sounds: ${options.sounds ? 'On' : 'Off'}`"
              ></v-switch>
              <v-switch
                v-if="shouldDisplayScreenCaptureOptions"
                class="mt-0"
                v-model="options.skipScannerGuide"
                :label="`Skip Scanning Guide: ${options.skipScannerGuide ? 'Yes' : 'No'}`"
              ></v-switch>
              <v-switch
                v-if="functionalCookiesAccepted"
                class="mt-0"
                v-model="options.autoSaveInputSets"
                :label="`Automatically save calculated input genes: ${options.autoSaveInputSets ? 'Yes' : 'No'}`"
                hint="Turning this off enables a save button that allows you to decide which genes you want to save."
                persistent-hint
              ></v-switch>
            </v-tab-item>
          </v-tabs-items>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="handleCloseButtonClick">
            Close
          </v-btn>
          <v-tooltip top open-delay="400" z-index="1001" max-width="600">
            <template v-slot:activator="{ on, attrs }">
              <v-btn v-bind="attrs" v-on="on" class="ml-2" color="primary" @click="setOptions" :disabled="!isFormValid">
                Set
              </v-btn>
            </template>
            <span>Sets the selected options for as long as the App is open.</span>
          </v-tooltip>
          <v-tooltip top open-delay="400" v-if="functionalCookiesAccepted" z-index="1001" max-width="600">
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
import { isScanningAvailable } from '@/lib/ui-utils';

/**
 * This property is used to version the options saved in the cookies.
 * If the structure of the options would change in the future this value should be incremented
 * to invalidate obsolote options saved by the User.
 */
const OPTIONS_VERSION = 4;
const hardwareConcurrency = navigator.hardwareConcurrency;
export const OPTIONS_COOKIE_PREFIX = 'options-v';
const OPTIONS_COOKIE_KEY = `${OPTIONS_COOKIE_PREFIX}${OPTIONS_VERSION}`;
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
  },
  darkMode: true,
  skipScannerGuide: false,
  autoSaveInputSets: true,
  sounds: true,
  numberOfWorkers: hardwareConcurrency
};
const STORED_OPTIONS = getCookie(OPTIONS_COOKIE_KEY);

@Component
export default class Options extends Vue {
  @Prop({ type: Boolean }) readonly functionalCookiesAccepted: boolean;
  isDialogOpen = false;
  isFormValid = false;
  tab = null;

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
  shouldDisplayScreenCaptureOptions = false;

  geneScoreRules = [
    (v: number | string) => (v !== '' && Number(v) >= -1 && Number(v) <= 1) || 'It has to be a number between -1 and 1.'
  ];
  numberOfSaplingsAddedBetweenGenerationsRules = [
    (v: number | string) => (v !== '' && Number(v) >= 1 && Number.isInteger(Number(v))) || 'Must be a positive integer.'
  ];
  minimumTrackedScoreRules = [
    (v: number | string) => (v !== '' && Number(v) >= -6 && Number(v) <= 6) || `Acceptable range: -6 to 6.`
  ];

  get maxNumberOfWorkers() {
    return hardwareConcurrency;
  }

  get numberOfWorkersLabels() {
    const modBy = this.maxNumberOfWorkers >= 24 ? 4 : this.maxNumberOfWorkers >= 16 ? 2 : 1;
    return Array.from({ length: this.maxNumberOfWorkers }, (value, index) => {
      const currentNumberOfWorkers = index + 1;
      return currentNumberOfWorkers % modBy === 0 ? currentNumberOfWorkers.toString() : '';
    });
  }

  get scoreInputs() {
    return Object.keys(this.options.geneScores || {})
      .map((key) => ({ key: key as GeneEnum, value: this.options.geneScores?.[key as GeneEnum] }))
      .filter((item, index) => index < 5);
  }

  get minimumTrackedScoreDerived() {
    const highestGeneScore = Math.max(...Object.values(this.options.geneScores));
    return highestGeneScore * 4;
  }

  created() {
    this.shouldDisplayScreenCaptureOptions = isScanningAvailable();

    // In case someone would change a processor in his PC and his navigator.hardwareConcurrency would be lower than before,
    // for best performance we want to maintain a value that is not higher than navigator.hardwareConcurrency.
    const reasonableNumberOfWorkers = Math.min(this.currentlySetOptions.numberOfWorkers, navigator.hardwareConcurrency);
    this.currentlySetOptions.numberOfWorkers = reasonableNumberOfWorkers;
    this.options.numberOfWorkers = reasonableNumberOfWorkers;
  }

  mounted() {
    this.$vuetify.theme.dark = this.currentlySetOptions.darkMode;
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
    this.resetTo(this.currentlySetOptions);
  }

  resetToDefaults() {
    this.resetTo(DEFAULT_OPTIONS);
  }

  resetTo(options: ApplicationOptions) {
    this.options = JSON.parse(JSON.stringify(options));
    this.crossbreedingSaplingsNumberRange = [
      this.options.minCrossbreedingSaplingsNumber,
      this.options.maxCrossbreedingSaplingsNumber
    ];
    this.$vuetify.theme.dark = this.options.darkMode;
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

  handleUIModeChange(checked: boolean) {
    this.$vuetify.theme.dark = checked;
  }

  storeOptionsInCookie() {
    setCookie(OPTIONS_COOKIE_KEY, JSON.stringify(this.currentlySetOptions), {
      expires: 356 * 5
    });
  }
}
</script>
