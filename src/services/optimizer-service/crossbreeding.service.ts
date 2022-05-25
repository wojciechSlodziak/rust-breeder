import Sapling from '../../models/sapling.model';
import Gene from '@/models/gene.model';
import { CrossbreedingGeneDetails, GeneWeightMap } from './models';

class CrossbreedingService {
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
