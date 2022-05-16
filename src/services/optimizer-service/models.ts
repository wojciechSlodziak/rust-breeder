import GeneEnum from '@/enums/gene.enum';
import GeneticsMap from '@/models/genetics-map.model';

export interface OptimizerServiceEventListenerCallback {
  (eventType: 'PROGRESS_UPDATE' | 'DONE', data: OptimizerServiceEventListenerCallbackData): void;
}

export class NotEnoughSourceSaplingsError extends Error {}
export class ImpracticalResultError extends Error {}

export class MapGroup {
  resultSaplingGeneString: string;
  mapList: GeneticsMap[];
  index?: number;
}

export interface OptimizerServiceEventListenerCallbackData {
  isDone?: boolean;
  progressPercent?: number;
  mapGroups?: MapGroup[];
}

export interface SimulateOptions {
  progressCallback: (combinationsProcessed: number, partialResultMapList: GeneticsMap[]) => void;
  callProgressCallbackAfterCombinations: number;
  callProgressCallbackAfterNumberOfResultsReached: number;
  geneScores: Record<GeneEnum, number>;
  withRepetitions: boolean;
  includeResultsWithMinimumScore: boolean;
  minimumScore: number;
}
