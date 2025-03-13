import Gene, { RED_GENE_WEIGHT } from '@/models/gene.model';
import Sapling from '../../models/sapling.model';
import { buildInitialSaplingPositions, getMaxPositionsCount, setNextPosition } from './helper';
import GeneEnum from '../../enums/gene.enum';
import { SimulateOptions, GenerationInfo, GeneticsMap, CrossbreedingResultWithDetails } from './models';
import { CrossbreedingGeneDetails } from './models';

class CrossbreedingService {
  /**
   * Method performs multiple crossbreedings for all sapling combinations that were designated by the application.
   * @param sourceSaplings List of source Saplings for given generation.
   * @param startingPositions Positions of sourceGenes saplings that the process should start from.
   * @param combinationsToProcess Number of combination this process has to calculate. Depends on the split between workers.
   * @param generationInfo Information about which generation of crossbreeding it is, and how many saplings were added from previous generation.
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

    let totalCombinationsProcessed = 0;
    let combinationsProcessedBeforeNextProgressCallback = 0;
    let hasFinishedWorkChunk = false;
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
      while (hasMoreCombinations && !hasFinishedWorkChunk) {
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
        totalCombinationsProcessed++;
        combinationsProcessedBeforeNextProgressCallback++;

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

        hasFinishedWorkChunk = totalCombinationsProcessed === combinationsToProcess;
        if (
          totalCombinationsProcessed % options.callProgressCallbackAfterCombinations === 0 ||
          options.callProgressCallbackAfterNumberOfResultsReached < results.length ||
          hasFinishedWorkChunk
        ) {
          options.progressCallback(combinationsProcessedBeforeNextProgressCallback, results);
          combinationsProcessedBeforeNextProgressCallback = 0;
          results = [];
        }
      }
    }
  }

  /**
   * Performs a crossbreeding process on a combination (subset) of source Saplings.
   * @param results Map of results. Passed as a reference.
   * @param sourceSaplings List of source Saplings provided by the User.
   * @param sourceSaplingsGeneStrings List of source Sapling genes.
   * @param crossbreedingSaplings A combination of Saplings that should be crossbred with each other.
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
    const winningCrossbreedingWeights = this.getWinningCrossbreedingWeights(crossbreedingSaplings);
    if (winningCrossbreedingWeights === null) {
      return;
    }

    const requiresCheckingAgainstCenterSapling = this.requiresCheckingAgainstCenterSapling(
      crossbreedingSaplings,
      winningCrossbreedingWeights
    );
    // Create results from the winningCrossbreedingWeights and center saplings (if applicable).
    if (requiresCheckingAgainstCenterSapling) {
      const otherSaplings: Sapling[] = sourceSaplings.filter(
        (sapling) => crossbreedingSaplings.indexOf(sapling) === -1
      );
      otherSaplings.forEach((potentialCenterSapling) => {
        const potentialResults = this.getCrossbreedingResults(
          winningCrossbreedingWeights,
          generationIndex,
          potentialCenterSapling
        );
        this.handlePotentialResultSaplings(
          results,
          sourceSaplingsGeneStrings,
          crossbreedingSaplings,
          geneScores,
          minimumTrackedScore,
          potentialResults,
          potentialCenterSapling
        );
      });
    } else {
      const potentialResults = this.getCrossbreedingResults(winningCrossbreedingWeights, generationIndex);
      this.handlePotentialResultSaplings(
        results,
        sourceSaplingsGeneStrings,
        crossbreedingSaplings,
        geneScores,
        minimumTrackedScore,
        potentialResults
      );
    }
  }

  private handlePotentialResultSaplings(
    results: GeneticsMap[],
    sourceSaplingsGeneStrings: string[],
    crossbreedingSaplings: Sapling[],
    geneScores: Record<GeneEnum, number>,
    minimumTrackedScore: number,
    potentialResults: CrossbreedingResultWithDetails[],
    potentialCenterSapling?: Sapling
  ) {
    // Filter out results that are the same as sourceSaplings.
    const filteredPotentialResults = potentialResults.filter(
      (potentialResult) => sourceSaplingsGeneStrings.indexOf(potentialResult.sapling.toString()) === -1
    );

    // Evaluate each Sapling and add to the results if positively evaluated.
    filteredPotentialResults.forEach((potentialResult) => {
      const score = potentialResult.sapling.getScore(geneScores);
      if (score >= minimumTrackedScore) {
        const sumOfComposingSaplingsGenerations =
          crossbreedingSaplings.reduce((acc, sapling) => acc + sapling.generationIndex, 0) +
          (potentialCenterSapling ? potentialCenterSapling.generationIndex : 0);
        const chance = 1 / potentialResults.length;
        results.push(
          new GeneticsMap(
            potentialResult.sapling,
            crossbreedingSaplings,
            score,
            chance,
            sumOfComposingSaplingsGenerations,
            potentialCenterSapling,
            potentialResult.tieWinningCrossbreedingSaplingIndexes,
            potentialResult.tieLosingCrossbreedingSaplingIndexes
          )
        );
      }
    });
  }

  /**
   * Method performs crossbreeding on a given list of saplings, and returns resulting crossbreedingWeights for winning genes.
   * Additionally, method checks if given combination should be ignored due to multiple ties OR if not all crossbreedingSaplings were used in the process.
   * @param crossbreedingSaplings A list of saplings which have to be crossbred with each other.
   * @returns List of positions with their winning or tieing genes. Returns null if combination should be ignored.
   */
  private getWinningCrossbreedingWeights(crossbreedingSaplings: Sapling[]): CrossbreedingGeneDetails[][] | null {
    const allPositionsCrossbreedingGeneDetails: CrossbreedingGeneDetails[][] = [];
    let numberOfEarlyRecognizableTies = 0;
    const saplingIndexesThatContributedToCrossbreeding: number[] = [];
    for (let genePosition = 0; genePosition < 6; genePosition++) {
      let highestTotalWeight = Number.MIN_VALUE;
      let currentPositionGeneDetails: CrossbreedingGeneDetails[] = [];
      crossbreedingSaplings.forEach((crossbreedingSapling, crossbreedingSaplingIndex) => {
        let geneDetail = currentPositionGeneDetails.find(
          (detail) => crossbreedingSapling.genes[genePosition].type === detail.geneType
        );
        if (!geneDetail) {
          geneDetail = {
            geneType: crossbreedingSapling.genes[genePosition].type,
            totalWeight: 0,
            contributingCrossbreedingSaplingIndexes: []
          };
          currentPositionGeneDetails.push(geneDetail);
        }
        geneDetail.totalWeight += crossbreedingSapling.genes[genePosition].getCrossbreedingWeight();
        highestTotalWeight = Math.max(highestTotalWeight, geneDetail.totalWeight);
        geneDetail.contributingCrossbreedingSaplingIndexes.push(crossbreedingSaplingIndex);
      });

      // Filters out genes that did not win or tie on the given position.
      currentPositionGeneDetails = currentPositionGeneDetails.filter(
        (detail) => detail.totalWeight === highestTotalWeight
      );

      // Keeps track of the contributing sapling indexes.
      currentPositionGeneDetails.forEach((geneDetail) => {
        geneDetail.contributingCrossbreedingSaplingIndexes.forEach((contributingCrossbreedingSaplingIndex) => {
          if (saplingIndexesThatContributedToCrossbreeding.indexOf(contributingCrossbreedingSaplingIndex) === -1) {
            saplingIndexesThatContributedToCrossbreeding.push(contributingCrossbreedingSaplingIndex);
          }
        });
      });

      // Keep track of the number of ties that can be recognized in this early stage.
      // If the weight of the genes is too low to surely overpower the potential center sapling we can't consider this as a definitive tie.
      if (currentPositionGeneDetails.length > 1 && currentPositionGeneDetails[0].totalWeight > RED_GENE_WEIGHT) {
        numberOfEarlyRecognizableTies += 1;
      }

      // If there is more than one tie, ignore the combination.
      if (numberOfEarlyRecognizableTies > 1) {
        return null;
      }

      allPositionsCrossbreedingGeneDetails.push(currentPositionGeneDetails);
    }

    // If not all crossbreedingSaplings were used in the process, ignore the combination.
    if (saplingIndexesThatContributedToCrossbreeding.length !== crossbreedingSaplings.length) {
      return null;
    }

    return allPositionsCrossbreedingGeneDetails;
  }

  /**
   * Method checks wether crossbreeding weights indicate that center sapling might impact the crossbreeding results.
   * @param crossbreedingSaplings A combination of Saplings used in the current crossbreeding session.
   * @param crossbreedingWeights Winning CrossbreedingGeneDetails for each gene position.
   * @returns Boolean value indicating if process has to consider crossbreeding given combination against a center sapling.
   */
  private requiresCheckingAgainstCenterSapling(
    crossbreedingSaplings: Sapling[],
    crossbreedingWeights: CrossbreedingGeneDetails[][]
  ): boolean {
    // Worst case scenario that requires checking against center sapling is when all of the genes are different and there are 5 different gene types.
    if (crossbreedingSaplings.length <= 5) {
      for (let genePosition = 0; genePosition < 6; genePosition++) {
        if (crossbreedingWeights[genePosition][0].totalWeight <= 1) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Method creates crossbred Saplings for given crossbreedingWeights and optionally a centerSapling.
   * Additionally it returns information about which crossbreedingSaplings win and which lose a tie (if there is one).
   * @param crossbreedingWeights Winning CrossbreedingGeneDetails for each gene position.
   * @param generationIndex Generation index of the produced saplings.
   * @param centerSapling Optional center sapling to crossbreed against.
   * @returns List of Sapling results with details about tie winners/losers. Returns empty list if combination should be ignored due multiple ties.
   */
  private getCrossbreedingResults(
    crossbreedingWeights: CrossbreedingGeneDetails[][],
    generationIndex: number,
    centerSapling?: Sapling
  ): CrossbreedingResultWithDetails[] {
    let crossbreedingResults: CrossbreedingResultWithDetails[] = [{ sapling: new Sapling(null, generationIndex) }];
    let numberOfDefinitiveTies = 0;
    for (let genePosition = 0; genePosition < 6; genePosition++) {
      const currentPositionCrossbreedingWeights = crossbreedingWeights[genePosition];

      const useCenterSaplingGene =
        centerSapling &&
        centerSapling.genes[genePosition].getCrossbreedingWeight() >=
          currentPositionCrossbreedingWeights[0].totalWeight;

      // This list will hold potential new results if a tie happens.
      const newCrossbreedingResults: CrossbreedingResultWithDetails[] = [];

      let shouldDiscardResult = false;
      crossbreedingResults.forEach((crossbreedingResult) => {
        if (useCenterSaplingGene) {
          const gene = centerSapling!.genes[genePosition];
          crossbreedingResult.sapling.addGene(gene);
        } else {
          if (currentPositionCrossbreedingWeights.length === 1) {
            const gene = new Gene(currentPositionCrossbreedingWeights[0].geneType);
            crossbreedingResult.sapling.addGene(gene);
          } else {
            // If at this stage we have more than one tie we can discard the result calculation of this combination.
            numberOfDefinitiveTies += 1;
            if (numberOfDefinitiveTies > 1) {
              shouldDiscardResult = true;
            } else {
              // If a tie has happened we have to multiply the results by cloning partial result that we built up untill now.
              currentPositionCrossbreedingWeights.forEach((geneDetailsForGivenPosition) => {
                // Here we only clone the sapling. We don't care about other properties
                // because they are only generated during a tie and we discard more than one tie scenarios.
                const newCrossbreedingResult: CrossbreedingResultWithDetails = {
                  sapling: crossbreedingResult.sapling.clone()
                };
                const gene = new Gene(geneDetailsForGivenPosition.geneType);
                newCrossbreedingResult.sapling.addGene(gene);
                newCrossbreedingResults.push(newCrossbreedingResult);

                // Here we are tracking the saplings that won in the tie.
                newCrossbreedingResult.tieWinningCrossbreedingSaplingIndexes =
                  geneDetailsForGivenPosition.contributingCrossbreedingSaplingIndexes;

                // Here we are tracking the saplings that lost in the tie.
                newCrossbreedingResult.tieLosingCrossbreedingSaplingIndexes = [];
                currentPositionCrossbreedingWeights.forEach((geneDetailsForGivenPositionToTrackingTieLosers) => {
                  if (geneDetailsForGivenPosition !== geneDetailsForGivenPositionToTrackingTieLosers) {
                    geneDetailsForGivenPositionToTrackingTieLosers.contributingCrossbreedingSaplingIndexes.forEach(
                      (index) => {
                        newCrossbreedingResult.tieLosingCrossbreedingSaplingIndexes!.push(index);
                      }
                    );
                  }
                });
              });
            }
          }
        }
      });

      // Multiple ties have happened.
      if (shouldDiscardResult) {
        return [];
      }

      // Check if a new set of results was populated due to a tie. if so, replace old set with new.
      if (newCrossbreedingResults.length > 0) {
        crossbreedingResults = newCrossbreedingResults;
      }
    }

    return crossbreedingResults;
  }
}

export default new CrossbreedingService();
