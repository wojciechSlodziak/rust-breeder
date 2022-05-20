import GeneEnum from '@/enums/gene.enum';
import Sapling from '@/models/sapling.model';

export interface OptimizerServiceEventListenerCallback {
  (eventType: 'PROGRESS_UPDATE' | 'DONE_GENERATION' | 'DONE', data: OptimizerServiceEventListenerCallbackData): void;
}

export class NotEnoughSourceSaplingsError extends Error {}
export class ImpracticalResultError extends Error {}

export class GeneticsMap {
  resultSapling!: Sapling;
  baseSapling?: Sapling;
  baseSaplingVariants?: GeneticsMapGroup;
  crossbreedSaplings!: Sapling[];
  crossbreedSaplingsVariants?: GeneticsMapGroup[];
  score!: number;
  chancePercent!: number;
  sumOfComposingSaplingsGenerations!: number;

  constructor(
    resultSapling: Sapling,
    crossbreedSaplings: Sapling[],
    score: number,
    chancePercent: number,
    sumOfComposingSaplingsGenerations: number,
    baseSapling?: Sapling
  ) {
    this.resultSapling = resultSapling;
    this.baseSapling = baseSapling;
    this.crossbreedSaplings = crossbreedSaplings;
    this.score = score;
    this.chancePercent = chancePercent;
    this.sumOfComposingSaplingsGenerations = sumOfComposingSaplingsGenerations;
  }

  clone(): GeneticsMap {
    const clone = new GeneticsMap(
      this.resultSapling.clone(),
      [...this.crossbreedSaplings.map((sapling) => sapling.clone())],
      this.score,
      this.chancePercent,
      this.sumOfComposingSaplingsGenerations,
      this.baseSapling
    );
    if (this.baseSaplingVariants) {
      clone.baseSaplingVariants = this.baseSaplingVariants.clone();
    }
    if (this.crossbreedSaplingsVariants) {
      clone.crossbreedSaplingsVariants = this.crossbreedSaplingsVariants.map((crossbreedSaplingsVariants) =>
        crossbreedSaplingsVariants.clone()
      );
    }
    return clone;
  }
}

export class GeneticsMapGroup {
  resultSaplingGeneString: string;
  mapList: GeneticsMap[];

  constructor(resultSaplingGeneString: string, mapList: GeneticsMap[]) {
    this.resultSaplingGeneString = resultSaplingGeneString;
    this.mapList = mapList;
  }

  clone(): GeneticsMapGroup {
    return new GeneticsMapGroup(
      this.resultSaplingGeneString,
      this.mapList.map((map) => map.clone())
    );
  }
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
  callProgressCallbackAfterNumberOfResultsReached: number;
  minCrossbreedingSaplingsNumber: number;
  maxCrossbreedingSaplingsNumber: number;
  numberOfSaplingsAddedBetweenGenerations: number;
  geneScores: Record<GeneEnum, number>;
  withRepetitions: boolean;
  minimumTrackedScore: number;
}
