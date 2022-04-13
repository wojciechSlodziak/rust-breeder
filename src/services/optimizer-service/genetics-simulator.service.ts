import GeneticsMap from '../../models/genetics-map.model';
import Sapling from '../../models/sapling.model';
import crossbreedingService from './crossbreeding.service';
import { buildInitialSaplingPositions, getMaxPositionsCount, setNextPosition } from './optimizer.helper';
import GeneEnum from '../../enums/gene.enum';
import { SimulateOptions } from './models';

class GeneticsSimulatorService {
  simulateCrossbreeding(
    sourceGenes: string[],
    startingPositions: number[],
    combinationsToProcess: number,
    options: SimulateOptions
  ) {
    const sourceSaplings: Sapling[] = sourceGenes.map((singleGenes) => new Sapling(singleGenes));
    let result: GeneticsMap[] = [];

    const originalBestScore = this.getOriginalBestScore(sourceSaplings, options.geneScores);

    let combinationsProcessed = 0;
    let positions: number[];
    for (
      let positionCount = startingPositions.length;
      positionCount <= getMaxPositionsCount(sourceSaplings.length, options.withRepetitions);
      positionCount++
    ) {
      positions =
        positionCount === startingPositions.length
          ? startingPositions
          : buildInitialSaplingPositions(positionCount, options.withRepetitions);
      let positionIndexForInc = positionCount - 1;
      let hasMoreCombinations = true;
      let crossbreedSaplings: Sapling[];
      while (hasMoreCombinations) {
        crossbreedSaplings = [];
        positions.forEach((position) => {
          crossbreedSaplings.push(sourceSaplings[position]);
        });

        this.performCrossbreedingAndScoring(
          result,
          sourceSaplings,
          crossbreedSaplings,
          originalBestScore,
          options.geneScores,
          options.includeResultsWithMinimumScore,
          options.minimumScore
        );
        combinationsProcessed++;

        const setNextPositionResult = setNextPosition(
          positions,
          positionIndexForInc,
          positionCount,
          sourceSaplings.length,
          options.withRepetitions
        );
        hasMoreCombinations = setNextPositionResult.hasMoreCombinations;
        positionIndexForInc = setNextPositionResult.nextPositionIndexForInc;

        if (
          (options && combinationsProcessed % options.callProgressCallbackAfterCombinations === 0) ||
          options.callProgressCallbackAfterNumberOfResultsReached < result.length ||
          combinationsProcessed === combinationsToProcess
        ) {
          options.progressCallback(
            combinationsProcessed,
            // Filter out result saplings that we already have provided by the User.
            result.filter((map) => sourceGenes.indexOf(map.targetSapling.toString()) === -1)
          );
          result = [];
        }
      }
    }
  }

  private performCrossbreedingAndScoring(
    result: GeneticsMap[],
    sourceSaplings: Sapling[],
    crossbreedSaplings: Sapling[],
    originalBestScore: number,
    geneScores: Record<GeneEnum, number>,
    includeResultsWithMinimumScore: boolean,
    minimumScore: number
  ) {
    let targetSaplings: Sapling[] = [];
    try {
      targetSaplings = crossbreedingService.crossbreed(crossbreedSaplings);
    } catch (e) {
      // do nothing!
    }

    targetSaplings.forEach((targetSapling) => {
      const numberOfBaseGenes = targetSapling.getNumberOfBaseGenes();

      if (numberOfBaseGenes > 0) {
        const otherSaplings: Sapling[] = sourceSaplings.filter((sapling) => crossbreedSaplings.indexOf(sapling) === -1);
        otherSaplings.forEach((baseSapling) => {
          const rebreedTargetSapling = crossbreedingService.crossbreedTargetWithBase(targetSapling, baseSapling);

          const score = rebreedTargetSapling.getScore(geneScores);
          if (includeResultsWithMinimumScore ? score >= minimumScore : score >= originalBestScore) {
            result.push({
              crossbreedSaplings,
              baseSapling,
              targetSapling: rebreedTargetSapling,
              score: score,
              chancePercent: Number((100 / targetSaplings.length).toFixed(2))
            });
          }
        });
      } else {
        const score = targetSapling.getScore(geneScores);
        if (includeResultsWithMinimumScore ? score >= minimumScore : score >= originalBestScore) {
          result.push({
            crossbreedSaplings,
            baseSapling: targetSapling.hasRedGenesWithLowestWeight()
              ? crossbreedingService.buildBaseSaplingWithMockGenes(targetSapling)
              : undefined,
            targetSapling,
            score: score,
            chancePercent: Number((100 / targetSaplings.length).toFixed(2))
          });
        }
      }
    });
  }

  private getOriginalBestScore(sourceSaplings: Sapling[], geneScores: Record<GeneEnum, number>) {
    let currentScore = Number.MIN_VALUE;
    sourceSaplings.forEach((sapling) => {
      const saplingScore = sapling.getScore(geneScores);
      currentScore = saplingScore > currentScore ? saplingScore : currentScore;
    });
    return currentScore;
  }
}

export default new GeneticsSimulatorService();
