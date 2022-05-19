import GeneEnum from '@/enums/gene.enum';
import Sapling from '@/models/sapling.model';

export interface OptimizerServiceEventListenerCallback {
  (eventType: 'PROGRESS_UPDATE' | 'DONE_GENERATION' | 'DONE', data: OptimizerServiceEventListenerCallbackData): void;
}

export class NotEnoughSourceSaplingsError extends Error {}
export class ImpracticalResultError extends Error {}

export class GeneticsMap {
  crossbreedSaplings!: Sapling[];
  /**
   * This property holds crossbreeding variants for crossbreedSaplings.
   * Only used for younger generations.
   */
  crossbreedSaplingsVariants?: GeneticsMapGroup[];
  resultSapling!: Sapling;
  baseSapling?: Sapling;
  baseSaplingVariants?: GeneticsMapGroup;
  score!: number;
  chancePercent!: number;
}

export class GeneticsMapGroup {
  resultSaplingGeneString: string;
  mapList: GeneticsMap[];
}

export class GenerationInfo {
  index: number;
  addedSaplings?: number;
}

export interface OptimizerServiceEventListenerCallbackData {
  progressPercent?: number;
  generationIndex: number;
  mapGroups?: GeneticsMapGroup[];
}

export interface SimulateOptions {
  progressCallback: (combinationsProcessed: number, partialResultMapList: GeneticsMap[]) => void;
  callProgressCallbackAfterCombinations: number;
  minCrossbreedingSaplingsNumber: number;
  maxCrossbreedingSaplingsNumber: number;
  numberOfSaplingsAddedBetweenGenerations: number;
  geneScores: Record<GeneEnum, number>;
  withRepetitions: boolean;
  minimumTrackedScore: number;
}
