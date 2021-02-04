import GeneEnum from '@/enums/gene.enum';
import GeneticsMap from '@/models/genetics-map.model';

export interface EventListenerCallback {
  (eventType: 'PROGRESS_UPDATE' | 'DONE', data: EventListenerCallbackData): void;
}

export class NotEnoughSourceSaplingsError extends Error {}

export class MapGroup {
  targetSaplingGeneString: string;
  mapList: GeneticsMap[];
  index?: number;
}

export interface EventListenerCallbackData {
  isDone?: boolean;
  progressPercent?: number;
  mapGroups?: MapGroup[];
}

export interface SimulateOptions {
  progressCallback: (percentDone: number) => void;
  callProgressCallbackAfterCombinations: number;
  geneScores: Record<GeneEnum, number>;
  allowRepetitions: boolean;
  includeAllResults: boolean;
}
