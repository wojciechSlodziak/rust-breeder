import Sapling from '../../models/sapling.model';
import crossbreedingService from './crossbreeding.service';
import { buildInitialSaplingPositions, getMaxPositionsCount, setNextPosition } from './optimizer.helper';
import GeneEnum from '../../enums/gene.enum';
import { SimulateOptions, ImpracticalResultError, GenerationInfo, GeneticsMap } from './models';

class GeneticsSimulatorService {
  /**
   * Method performs multiple crossbreedings for all sapling combinations that were designated by the application.
   * @param sourceSaplings List of source Saplings for given generation.
   * @param startingPositions Positions of sourceGenes saplings that the process should start from.
   * @param combinationsToProcess Number of combination this process has to calculate. Depends on the split between workers.
   * @param options Options provided from the UI.
   */
  simulateCrossbreeding(
    sourceSaplings: Sapling[],
    startingPositions: number[],
    combinationsToProcess: number,
    generationInfo: GenerationInfo,
    options: SimulateOptions
  ) {
    let result: GeneticsMap[] = [];
    const sourceGenes = sourceSaplings.map((sourceSapling) => sourceSapling.toString());

    let combinationsProcessed = 0;
    let positions: number[];
    for (
      let positionCount = startingPositions.length;
      positionCount <=
      getMaxPositionsCount(sourceSaplings.length, options.withRepetitions, options.maxCrossbreedingSaplingsNumber);
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
        // console.log(positions);
        crossbreedSaplings = [];
        positions.forEach((position) => {
          crossbreedSaplings.push(sourceSaplings[position]);
        });

        this.performCrossbreedingAndScoring(
          result,
          sourceSaplings,
          crossbreedSaplings,
          options.geneScores,
          options.minimumTrackedScore,
          generationInfo.index
        );
        combinationsProcessed++;

        const setNextPositionResult = setNextPosition(
          positions,
          positionIndexForInc,
          positionCount,
          sourceSaplings.length,
          options.withRepetitions,
          generationInfo.addedSaplings
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
   * @param geneScores Score for gene provided from the app options, which help in scoring the completed Sapling.
   * @param minimumTrackedScore The minimumTrackedScore used for discarding results.
   */
  private performCrossbreedingAndScoring(
    result: GeneticsMap[],
    sourceSaplings: Sapling[],
    crossbreedSaplings: Sapling[],
    geneScores: Record<GeneEnum, number>,
    minimumTrackedScore: number,
    generationIndex: number
  ) {
    let resultSaplings: Sapling[] = [];
    try {
      resultSaplings = crossbreedingService.crossbreed(crossbreedSaplings, generationIndex);
    } catch (e) {
      if (e instanceof ImpracticalResultError) {
        // Do nothing! In case of exceptions the process should go on.
      } else {
        throw e;
      }
    }

    resultSaplings.forEach((resultSapling) => {
      const numberOfBaseGenes = resultSapling.getNumberOfBaseGenes();

      if (numberOfBaseGenes > 0) {
        const otherSaplings: Sapling[] = sourceSaplings.filter((sapling) => crossbreedSaplings.indexOf(sapling) === -1);
        otherSaplings.forEach((baseSapling) => {
          const rebreedresultSapling = crossbreedingService.crossbreedResultWithBase(
            resultSapling,
            baseSapling,
            generationIndex
          );

          const score = rebreedresultSapling.getScore(geneScores);
          if (score >= minimumTrackedScore) {
            rebreedresultSapling.cleanupCrossbreedingJunk();
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
        if (score >= minimumTrackedScore) {
          const baseSapling = resultSapling.hasRedGenesWithLowestWeight()
            ? crossbreedingService.buildBaseSaplingWithMockGenes(resultSapling)
            : undefined;
          resultSapling.cleanupCrossbreedingJunk();
          result.push({
            crossbreedSaplings,
            baseSapling,
            resultSapling,
            score: score,
            chancePercent: Number((100 / resultSaplings.length).toFixed(2))
          });
        }
      }
    });
  }
}

export default new GeneticsSimulatorService();
