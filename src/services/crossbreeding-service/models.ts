import GeneEnum from '@/enums/gene.enum';
import Sapling from '@/models/sapling.model';

export interface CrossbreedingOrchestratorEventListenerCallback {
  (
    eventType: 'PROGRESS_UPDATE' | 'DONE_GENERATION' | 'DONE',
    data: CrossbreedingOrchestratorEventListenerCallbackData
  ): void;
}

export class WorkChunk {
  startingPositions: number[];
  combinationsToProcess: number;
  allCombinationsCount: number;
}

export class NotEnoughSourceSaplingsError extends Error {}

export class ProcessingStat {
  timestamp: number;
  combinationsProcessed: number;
}

export class CrossbreedingGeneDetails {
  geneType: GeneEnum;
  totalWeight = 0;
  contributingCrossbreedingSaplingIndexes = new Set<number>();
}

export class GeneWeightMap {
  [geneType: string]: CrossbreedingGeneDetails;
}

export class GeneticsMap {
  resultSapling!: Sapling;
  baseSapling?: Sapling;
  baseSaplingVariants?: GeneticsMapGroup;
  crossbreedingSaplings!: Sapling[];
  crossbreedingSaplingsVariants?: GeneticsMapGroup[];
  score!: number;
  chance!: number;
  sumOfComposingSaplingsGenerations!: number;

  constructor(
    resultSapling: Sapling,
    crossbreedingSaplings: Sapling[],
    score: number,
    chance: number,
    sumOfComposingSaplingsGenerations: number,
    baseSapling?: Sapling
  ) {
    this.resultSapling = resultSapling;
    this.baseSapling = baseSapling;
    this.crossbreedingSaplings = crossbreedingSaplings;
    this.score = score;
    this.chance = chance;
    this.sumOfComposingSaplingsGenerations = sumOfComposingSaplingsGenerations;
  }

  clone(): GeneticsMap {
    const clone = new GeneticsMap(
      this.resultSapling.clone(),
      [...this.crossbreedingSaplings.map((sapling) => sapling.clone())],
      this.score,
      this.chance,
      this.sumOfComposingSaplingsGenerations,
      this.baseSapling
    );
    if (this.baseSaplingVariants) {
      clone.baseSaplingVariants = this.baseSaplingVariants.clone();
    }
    if (this.crossbreedingSaplingsVariants) {
      clone.crossbreedingSaplingsVariants = this.crossbreedingSaplingsVariants.map((crossbreedingSaplingsVariants) =>
        crossbreedingSaplingsVariants.clone()
      );
    }
    return clone;
  }

  getChanceProduct() {
    let chanceProduct = this.chance;
    if (this.crossbreedingSaplingsVariants) {
      this.crossbreedingSaplingsVariants.forEach((crossbreedingSaplingsVariant) => {
        if (crossbreedingSaplingsVariant) {
          chanceProduct *= crossbreedingSaplingsVariant
            ? crossbreedingSaplingsVariant.mapList[0].getChanceProduct()
            : 1;
        }
      });
      if (this.baseSaplingVariants) {
        chanceProduct *= this.baseSaplingVariants.mapList[0].getChanceProduct();
      }
    }
    return chanceProduct;
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

export interface CrossbreedingOrchestratorEventListenerCallbackData {
  progressPercent?: number;
  generationIndex: number;
  estimatedTimeMs: number | null;
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
