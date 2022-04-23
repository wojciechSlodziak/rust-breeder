import GeneticsMap from '../../models/genetics-map.model';
import Sapling from '../../models/sapling.model';
import crossbreedingService from './crossbreeding.service';
import { buildInitialSaplingPositions, getMaxPositionsCount, setNextPosition } from './optimizer.helper';
import GeneEnum from '../../enums/gene.enum';
import { SimulateOptions } from './models';

class GeneticsSimulatorService {

  /**
   * Method performs multiple crossbreedings for all sapling combinations that were designated by the application.
   * @param sourceGenes List of raw String representations of saplings.
   * @param startingPositions Positions of sourceGenes saplings that the process should start from.
   * @param combinationsToProcess Number of combination this process has to calculate. Depends on the split between workers.
   * @param options Options provided from the UI.
   */
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
            // Filter out result saplings that were already provided by the User.
            // We don't need to make something that we already have.
            result.filter((map) => sourceGenes.indexOf(map.resultSapling.toString()) === -1)
          );
          result = [];
        }
      }
    }
  }

  /**
   * Performs a crossbreeding process on a combination (subset) of source Saplings.
   * @param result Map of results. Passed as a reference.
   * @param sourceSaplings List of source Saplings built from the genes provided by the User.
   * @param crossbreedSaplings A combination of Saplings that should be crossbreeded with each other.
   * @param originalBestScore Best score from the source Saplings, used for discarding bad results.
   * @param geneScores Score for gene provided from the app options, which help in scoring the completed Sapling.
   * @param includeResultsWithMinimumScore Boolean value provided from options, which if true allows app to ignore originalBestScore 
   * and to to return worse results which are above the minimumScore.
   * @param minimumScore The minimumScore used for discarding results if includeResultsWithMinimumScore is true.
   */
  private performCrossbreedingAndScoring(
    result: GeneticsMap[],
    sourceSaplings: Sapling[],
    crossbreedSaplings: Sapling[],
    originalBestScore: number,
    geneScores: Record<GeneEnum, number>,
    includeResultsWithMinimumScore: boolean,
    minimumScore: number
  ) {
    let resultSaplings: Sapling[] = [];
    try {
      resultSaplings = crossbreedingService.crossbreed(crossbreedSaplings);
    } catch (e) {
      // Do nothing! In case of exceptions the process should go on.
    }

    resultSaplings.forEach((resultSapling) => {
      const numberOfBaseGenes = resultSapling.getNumberOfBaseGenes();

      if (numberOfBaseGenes > 0) {
        const otherSaplings: Sapling[] = sourceSaplings.filter((sapling) => crossbreedSaplings.indexOf(sapling) === -1);
        otherSaplings.forEach((baseSapling) => {
          const rebreedresultSapling = crossbreedingService.crossbreedResultWithBase(resultSapling, baseSapling);

          const score = rebreedresultSapling.getScore(geneScores);
          if (includeResultsWithMinimumScore ? score >= minimumScore : score >= originalBestScore) {
            result.push({
              crossbreedSaplings,
              baseSapling,
              resultSapling: rebreedresultSapling,
              score: score,
              chancePercent: Number((100 / resultSaplings.length).toFixed(2))
            });
          }
        });
      } else {
        const score = resultSapling.getScore(geneScores);
        if (includeResultsWithMinimumScore ? score >= minimumScore : score >= originalBestScore) {
          result.push({
            crossbreedSaplings,
            baseSapling: resultSapling.hasRedGenesWithLowestWeight()
              ? crossbreedingService.buildBaseSaplingWithMockGenes(resultSapling)
              : undefined,
            resultSapling,
            score: score,
            chancePercent: Number((100 / resultSaplings.length).toFixed(2))
          });
        }
      }
    });
  }

  /**
   * Calculates scores for all Saplings provided by User, and returns the best one.
   * @param sourceSaplings List of source Saplings built from the genes provided by the User.
   * @param geneScores Score for gene provided from the app options, which help in scoring the completed Sapling.
   * @returns A number score for the best Sapling in the sourceSaplings.
   */
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
