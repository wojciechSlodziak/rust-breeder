import Sapling from '../../models/sapling.model';
import crossbreedingService from './crossbreeding.service';
import { buildInitialSaplingPositions, getMaxPositionsCount, setNextPosition } from './optimizer.helper';
import GeneEnum from '../../enums/gene.enum';
import { SimulateOptions, GenerationInfo, GeneticsMap } from './models';

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
    let results: GeneticsMap[] = [];
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
      let crossbreedingSaplings: Sapling[];
      while (hasMoreCombinations) {
        crossbreedingSaplings = [];
        positions.forEach((position) => {
          crossbreedingSaplings.push(sourceSaplings[position]);
        });

        this.crossbreedAndEvaluate(
          results,
          sourceSaplings,
          sourceGenes,
          crossbreedingSaplings,
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
          combinationsProcessed % options.callProgressCallbackAfterCombinations === 0 ||
          options.callProgressCallbackAfterNumberOfResultsReached < results.length ||
          combinationsProcessed === combinationsToProcess
        ) {
          options.progressCallback(combinationsProcessed, results);
          results = [];
        }
      }
    }
  }

  /**
   * Performs a crossbreeding process on a combination (subset) of source Saplings.
   * @param result Map of results. Passed as a reference.
   * @param sourceSaplings List of source Saplings provided by the User.
   * @param sourceSaplingsGeneStrings List of source Sapling genes.
   * @param crossbreedingSaplings A combination of Saplings that should be crossbreeded with each other.
   * @param geneScores Score for gene provided from the app options, which help in scoring the completed Sapling.
   * @param minimumTrackedScore The minimumTrackedScore used for discarding results.
   */
  private crossbreedAndEvaluate(
    results: GeneticsMap[],
    sourceSaplings: Sapling[],
    sourceSaplingsGeneStrings: string[],
    crossbreedingSaplings: Sapling[],
    geneScores: Record<GeneEnum, number>,
    minimumTrackedScore: number,
    generationIndex: number
  ) {
    const crossbreedingWeights = crossbreedingService.getCrossbreedingWeights(crossbreedingSaplings);
    const winningCrossbreedingWeights = crossbreedingService.getWinningCrossbreedingWeights(crossbreedingWeights);

    if (
      crossbreedingService.checkIfCrossbreedingCombinationShouldBeIgnored(
        winningCrossbreedingWeights,
        crossbreedingSaplings.length
      )
    ) {
      return;
    }

    const requiresCheckingAgainstCenterSapling = crossbreedingService.requiresCheckingAgainstCenterSapling(
      winningCrossbreedingWeights
    );

    // Create results from the crossbreedingWeights and center saplings (if applicable).
    if (requiresCheckingAgainstCenterSapling) {
      const otherSaplings: Sapling[] = sourceSaplings.filter(
        (sapling) => crossbreedingSaplings.indexOf(sapling) === -1
      );
      otherSaplings.forEach((potentialCenterSapling) => {
        const potentialResultSaplings = crossbreedingService.getCrossbreedingResultsWithPredefinedCenterSapling(
          winningCrossbreedingWeights,
          potentialCenterSapling,
          generationIndex
        );
        this.handlePotentialResultSaplings(
          results,
          sourceSaplingsGeneStrings,
          crossbreedingSaplings,
          geneScores,
          minimumTrackedScore,
          potentialResultSaplings,
          potentialCenterSapling
        );
      });
    } else {
      const potentialResultSaplings = crossbreedingService.getCrossbreedingResults(
        winningCrossbreedingWeights,
        generationIndex
      );
      this.handlePotentialResultSaplings(
        results,
        sourceSaplingsGeneStrings,
        crossbreedingSaplings,
        geneScores,
        minimumTrackedScore,
        potentialResultSaplings
      );
    }
  }

  private handlePotentialResultSaplings(
    results: GeneticsMap[],
    sourceSaplingsGeneStrings: string[],
    crossbreedingSaplings: Sapling[],
    geneScores: Record<GeneEnum, number>,
    minimumTrackedScore: number,
    potentialResultSaplings: Sapling[],
    potentialCenterSapling?: Sapling
  ) {
    // Filter out results that are the same as sourceSaplings.
    const filteredPotentialResultSaplings = potentialResultSaplings.filter(
      (sapling) => sourceSaplingsGeneStrings.indexOf(sapling.toString()) === -1
    );

    // Evaluate each Sapling and add to the results if positively evaluated.
    filteredPotentialResultSaplings.forEach((potentialResultSapling) => {
      const score = potentialResultSapling.getScore(geneScores);
      if (score >= minimumTrackedScore) {
        const sumOfComposingSaplingsGenerations =
          crossbreedingSaplings.reduce((acc, sapling) => acc + sapling.generationIndex, 0) +
          (potentialCenterSapling ? potentialCenterSapling.generationIndex : 0);
        const chancePercent = Number((100 / potentialResultSaplings.length).toFixed(2));
        results.push(
          new GeneticsMap(
            potentialResultSapling,
            crossbreedingSaplings,
            score,
            chancePercent,
            sumOfComposingSaplingsGenerations,
            potentialCenterSapling
          )
        );
      }
    });
  }
}

export default new GeneticsSimulatorService();
