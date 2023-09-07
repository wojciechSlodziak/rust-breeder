import GeneEnum from '@/enums/gene.enum';

export default interface ApplicationOptions {
  withRepetitions: boolean;
  modifyMinimumTrackedScoreManually: boolean;
  minCrossbreedingSaplingsNumber: number;
  maxCrossbreedingSaplingsNumber: number;
  numberOfGenerations: number;
  numberOfSaplingsAddedBetweenGenerations: number;
  minimumTrackedScore: number;
  geneScores: Record<GeneEnum, number>;
  darkMode: boolean;
  sounds: boolean;
  skipScannerGuide: boolean;
  autoSaveInputSets: boolean;
  numberOfWorkers: number;
}
