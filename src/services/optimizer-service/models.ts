import GeneEnum from '@/enums/gene.enum';
import GeneticsMap from '@/models/genetics-map.model';

export interface EventListenerCallback {
  (eventType: 'PROGRESS_UPDATE' | 'DONE', data: EventListenerCallbackData): void;
}

export class NotEnoughSourceSaplingsError extends Error {}

export class MapGroup {
  resultSaplingGeneString: string;
  mapList: GeneticsMap[];
  index?: number;
}

export interface EventListenerCallbackData {
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
