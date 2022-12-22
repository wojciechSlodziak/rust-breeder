import Gene from '@/models/gene.model';
import Sapling from '../../models/sapling.model';
import { buildInitialSaplingPositions, getMaxPositionsCount, setNextPosition } from './helper';
import GeneEnum from '../../enums/gene.enum';
import { SimulateOptions, GenerationInfo, GeneticsMap } from './models';
import { CrossbreedingGeneDetails, GeneWeightMap } from './models';

class CrossbreedingService {
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
    const crossbreedingWeights = this.getCrossbreedingWeights(crossbreedingSaplings);
    const winningCrossbreedingWeights = this.getWinningCrossbreedingWeights(crossbreedingWeights);

    if (
      this.checkIfCrossbreedingCombinationShouldBeIgnored(winningCrossbreedingWeights, crossbreedingSaplings.length)
    ) {
      return;
    }

    const requiresCheckingAgainstCenterSapling = this.requiresCheckingAgainstCenterSapling(winningCrossbreedingWeights);

    // Create results from the crossbreedingWeights and center saplings (if applicable).
    if (requiresCheckingAgainstCenterSapling) {
      const otherSaplings: Sapling[] = sourceSaplings.filter(
        (sapling) => crossbreedingSaplings.indexOf(sapling) === -1
      );
      otherSaplings.forEach((potentialCenterSapling) => {
        const potentialResultSaplings = this.getCrossbreedingResultsWithPredefinedCenterSapling(
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
      const potentialResultSaplings = this.getCrossbreedingResults(winningCrossbreedingWeights, generationIndex);
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
        const chance = 1 / potentialResultSaplings.length;
        results.push(
          new GeneticsMap(
            potentialResultSapling,
            crossbreedingSaplings,
            score,
            chance,
            sumOfComposingSaplingsGenerations,
            potentialCenterSapling
          )
        );
      }
    });
  }

  /**
   * Method performs crossbreeding on a given list of saplings, and returns resulting crossbreedingWeights.
   * @param crossbreedingSaplings A list of saplings which have to be crossbreeded with each other.
   * @returns List of GeneWeightMap. List position corresponds to the gene indexes.
   */
  getCrossbreedingWeights(crossbreedingSaplings: Sapling[]): GeneWeightMap[] {
    const geneToWeightMaps: GeneWeightMap[] = [];
    for (let genePosition = 0; genePosition < 6; genePosition++) {
      const geneToWeightMap: GeneWeightMap = {};
      crossbreedingSaplings.forEach((crossbreedingSapling, crossbreedingSaplingIndex) => {
        let details = geneToWeightMap[crossbreedingSapling.genes[genePosition].type];
        if (!details) {
          details = new CrossbreedingGeneDetails();
          details.geneType = crossbreedingSapling.genes[genePosition].type;
          geneToWeightMap[crossbreedingSapling.genes[genePosition].type] = details;
        }
        details.totalWeight += crossbreedingSapling.genes[genePosition].getCrossbreedingWeight();
        details.contributingCrossbreedingSaplingIndexes.add(crossbreedingSaplingIndex);
      });
      geneToWeightMaps.push(geneToWeightMap);
    }
    return geneToWeightMaps;
  }

  /**
   * Method filters out @param crossbreedingWeights for the winning genes.
   * @param crossbreedingWeights A list of GeneWeightMap with all gene weights that were calculated before.
   * List position corresponds to the gene indexes.
   * @returns Filtered list (gene position) of lists (winning CrossbreedingGeneDetails).
   */
  getWinningCrossbreedingWeights(crossbreedingWeights: GeneWeightMap[]): CrossbreedingGeneDetails[][] {
    const winningCrossbreedingGenesDetailsPerPosition: CrossbreedingGeneDetails[][] = [];
    crossbreedingWeights.forEach((crossbreedingWeightsForPosition) => {
      let highestGeneWeight = Number.MIN_VALUE;
      Object.values(crossbreedingWeightsForPosition).forEach((crossbreedingGeneDetails) => {
        if (crossbreedingGeneDetails.totalWeight > highestGeneWeight) {
          highestGeneWeight = crossbreedingGeneDetails.totalWeight;
        }
      });

      winningCrossbreedingGenesDetailsPerPosition.push(
        Object.values(crossbreedingWeightsForPosition).filter(
          (crossbreedingGeneDetails) => crossbreedingGeneDetails.totalWeight === highestGeneWeight
        )
      );
    });
    return winningCrossbreedingGenesDetailsPerPosition;
  }

  /**
   * Method checks wether crossbreeding combination should be ignored due to leading to a lower than 50% - 50% chance (or 33% - 33% - 33%) results,
   * OR if not all crossbreedingSaplings were used in the process.
   * @param crossbreedingWeights List (gene position) of lists (winning CrossbreedingGeneDetails).
   * @returns Boolean value indicating if crossbreeding combination should be ignored.
   */
  checkIfCrossbreedingCombinationShouldBeIgnored(
    crossbreedingWeights: CrossbreedingGeneDetails[][],
    numberOfCrossbreedingSaplings: number
  ): boolean {
    let numberOfIndefinitiveResults = 0;
    const contributingCrossbreedingSaplingIndexes = new Set<number>();
    for (let genePosition = 0; genePosition < 6; genePosition++) {
      numberOfIndefinitiveResults += crossbreedingWeights[genePosition].length > 1 ? 1 : 0;
      crossbreedingWeights[genePosition].forEach((crossbreedingGeneDetails) => {
        if (contributingCrossbreedingSaplingIndexes.size !== numberOfCrossbreedingSaplings) {
          crossbreedingGeneDetails.contributingCrossbreedingSaplingIndexes.forEach(
            (contributingCrossbreedingSaplingIndex) => {
              contributingCrossbreedingSaplingIndexes.add(contributingCrossbreedingSaplingIndex);
            }
          );
        }
      });
      if (numberOfIndefinitiveResults > 1) {
        return true;
      }
    }
    if (contributingCrossbreedingSaplingIndexes.size !== numberOfCrossbreedingSaplings) {
      return true;
    }
    return false;
  }

  /**
   * Method checks wether crossbreeding weights indicate that center sapling might impact the crossbreeding results.
   * @param crossbreedingWeights List (gene position) of lists (winning CrossbreedingGeneDetails).
   * @returns Boolean value indicating if process has to crossbreed given combination considering center sapling.
   */
  requiresCheckingAgainstCenterSapling(crossbreedingWeights: CrossbreedingGeneDetails[][]): boolean {
    for (let genePosition = 0; genePosition < 6; genePosition++) {
      if (crossbreedingWeights[genePosition][0].totalWeight <= 1) {
        return true;
      }
    }
    return false;
  }

  /**
   * Method creates crossbreeded Saplings for given crossbreedingWeights and centerSapling.
   * @param crossbreedingWeights List (gene position) of lists (winning CrossbreedingGeneDetails).
   * @param centerSapling Center sapling to crossbreed against.
   * @param generationIndex Generation index of the resulting saplings.
   * @returns List of Sapling results.
   */
  getCrossbreedingResultsWithPredefinedCenterSapling(
    crossbreedingWeights: CrossbreedingGeneDetails[][],
    centerSapling: Sapling,
    generationIndex: number
  ): Sapling[] {
    const resultSaplings: Sapling[] = [new Sapling(null, generationIndex)];
    for (let genePosition = 0; genePosition < 6; genePosition++) {
      if (crossbreedingWeights[genePosition].length > 1) {
        for (let cloneIndex = 1; cloneIndex < crossbreedingWeights[genePosition].length; cloneIndex++) {
          resultSaplings.push(resultSaplings[0].clone());
        }
      }
      resultSaplings.forEach((resultSapling, resultSaplingIndex) => {
        const geneDetailsIndex = crossbreedingWeights[genePosition].length > 1 ? resultSaplingIndex : 0;
        const useCenterSaplingGene =
          crossbreedingWeights[genePosition][geneDetailsIndex].totalWeight <=
          centerSapling.genes[genePosition].getCrossbreedingWeight();
        const gene = useCenterSaplingGene
          ? centerSapling.genes[genePosition]
          : new Gene(crossbreedingWeights[genePosition][geneDetailsIndex].geneType);
        resultSapling.addGene(gene);
      });
    }

    // If there is more than one result, and [0] and [1] third will also be. No need to check.
    if (resultSaplings.length > 1 && resultSaplings[0].toString() === resultSaplings[1].toString()) {
      return [resultSaplings[0]];
    }
    return resultSaplings;
  }

  /**
   * Method creates crossbreeded Saplings for given crossbreedingWeights.
   * @param crossbreedingWeights List (gene position) of lists (winning CrossbreedingGeneDetails).
   * @param generationIndex Generation index of the resulting saplings.
   * @returns List of Sapling results.
   */
  getCrossbreedingResults(crossbreedingWeights: CrossbreedingGeneDetails[][], generationIndex: number): Sapling[] {
    const resultSaplings: Sapling[] = [new Sapling(null, generationIndex)];
    for (let genePosition = 0; genePosition < 6; genePosition++) {
      if (crossbreedingWeights[genePosition].length > 1) {
        for (let cloneIndex = 1; cloneIndex < crossbreedingWeights[genePosition].length; cloneIndex++) {
          resultSaplings.push(resultSaplings[0].clone());
        }
      }
      resultSaplings.forEach((resultSapling, resultSaplingIndex) => {
        const geneDetailsIndex = crossbreedingWeights[genePosition].length > 1 ? resultSaplingIndex : 0;
        resultSapling.addGene(new Gene(crossbreedingWeights[genePosition][geneDetailsIndex].geneType));
      });
    }
    return resultSaplings;
  }
}

export default new CrossbreedingService();
