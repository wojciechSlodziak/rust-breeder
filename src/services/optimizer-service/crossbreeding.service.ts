import Sapling from '../../models/sapling.model';
import GeneEnum from '../../enums/gene.enum';
import Gene from '@/models/gene.model';

class CrossbreedingService {

  /**
   * Method performs crossbreeding on a given list of saplings, and returns saplings that can come out of the process.
   * @param crossbreedSaplings A list of saplings which have to be crosbreeded with each other.
   * @returns A list of results that are possible outcomes for the given crossbreedSaplings.
   */
  crossbreed(crossbreedSaplings: Sapling[]): Sapling[] {
    let targetSaplings: Sapling[] = [new Sapling()];
    const involvedSaplings: Sapling[] = [];
    for (let genePosition = 0; genePosition < 6; genePosition++) {
      const geneToWeightMap: Record<GeneEnum, number> = {
        [GeneEnum.G]: 0,
        [GeneEnum.Y]: 0,
        [GeneEnum.H]: 0,
        [GeneEnum.X]: 0,
        [GeneEnum.W]: 0,
        [GeneEnum.B]: 0, // not used in this context, but required by TS
        [GeneEnum.MG]: 0, // not used in this context, but required by TS
        [GeneEnum.MA]: 0 // not used in this context, but required by TS
      };
      crossbreedSaplings.forEach((crossbreedSapling) => {
        geneToWeightMap[crossbreedSapling.genes[genePosition].type] =
          (geneToWeightMap[crossbreedSapling.genes[genePosition].type]
            ? geneToWeightMap[crossbreedSapling.genes[genePosition].type]
            : 0) + crossbreedSapling.genes[genePosition].crossbreedingWeight();
      });

      let highestGeneWeight = Number.MIN_VALUE;
      Object.keys(geneToWeightMap).forEach((key) => {
        if (geneToWeightMap[key as GeneEnum] > highestGeneWeight) {
          highestGeneWeight = geneToWeightMap[key as GeneEnum];
        }
      });

      const winnerGeneTypes: GeneEnum[] = [];
      // If winner gene is not dominant enough B gene is stored instead.
      // This special type of gene indicates possibility of using Base Sapling's genes in the crosbreeding process.
      if (highestGeneWeight < 1) {
        winnerGeneTypes.push(GeneEnum.B);
      } else {
        Object.keys(geneToWeightMap).forEach((key) => {
          if (geneToWeightMap[key as GeneEnum] === highestGeneWeight) {
            winnerGeneTypes.push(key as GeneEnum);
          }
        });
      }

      // This extra piece of code tracks whether all the saplings were actually used to get the final results.
      winnerGeneTypes.forEach((geneType) => {
        crossbreedSaplings.forEach((sapling) => {
          if (sapling.genes[genePosition].type === geneType && involvedSaplings.indexOf(sapling) === -1) {
            involvedSaplings.push(sapling);
          }
        });
      });

      // Ignore results where there is more than one non dominant gene position.
      // Rust behaves unexpectedly for those scenarios and the results are not deterministic.
      // Note: 33.(3)% chances are still ok if 3 different genes had the same weight on a given position.
      if (targetSaplings.length > 1 && winnerGeneTypes.length > 1) {
        throw new Error('Ignore result set due to unexpected game behavior for results with more than one non dominant gene positions.');
      }

      // Code creates new result Saplings for given winner genes. 
      // Each gene position in result sapling(s) is filled one by one for each main iteration.
      // It is possible that more than one Result sapling can be created if on a given 
      // position two or three different genes have the same weight.
      const targetSaplingsToAppend: Sapling[] = [];
      for (let winnerGeneTypeIndex = winnerGeneTypes.length - 1; winnerGeneTypeIndex >= 0; winnerGeneTypeIndex -= 1) {
        targetSaplings.forEach((targetSapling) => {
          if (winnerGeneTypeIndex !== 0) {
            const additionalTargetSapling = targetSapling.clone();
            additionalTargetSapling.addGene(new Gene(winnerGeneTypes[winnerGeneTypeIndex]), highestGeneWeight);
            targetSaplingsToAppend.push(additionalTargetSapling);
          } else {
            targetSapling.addGene(new Gene(winnerGeneTypes[winnerGeneTypeIndex]), highestGeneWeight);
          }
        });
      }

      if (targetSaplingsToAppend.length > 0) {
        targetSaplings = [...targetSaplings, ...targetSaplingsToAppend];
      }
    }

    // If not all the saplings were used to get the final results, the current set of crossbreedSaplings is ignored, 
    // because the same results can be achieved with smaller set of saplings, and will be found in another iteration.
    if (
      !crossbreedSaplings.reduce(
        (allInvolvedSoFar, crossbreedSapling) => allInvolvedSoFar && involvedSaplings.indexOf(crossbreedSapling) !== -1,
        true
      )
    ) {
      throw new Error('Not all saplings were used for crossbreeding.');
    }

    return targetSaplings.filter((sapling) => sapling.getNumberOfBaseGenes() < 6);
  }

  /**
   * Method is used for overriding target sapling's B (non-dominant) type genes with the base plant's original gene.
   * This can happen if crosbreeding saplings don't reach a weight sum higher on a given position than the base plant's weight.
   * At this stage it's not decided whether the outcome of this crossbreeding will be anything useful, as it might end up
   * being a result with low score.
   * @param targetSapling The sapling that resulted from crosbreeding process, and which needs to be crossbreeded 
   * with base sapling due to it's genes being not fully dominant.
   * @param baseSapling One of the saplings provided to the corssbreeding process, which need to be checked for outcome.
   * @returns Result sapling after merging targetSapling and baseSapling.
   */
  crossbreedTargetWithBase(targetSapling: Sapling, baseSapling: Sapling) {
    const finalTargetSapling = new Sapling();
    targetSapling.genes.forEach((gene, index) => {
      if (
        gene.type === GeneEnum.B ||
        targetSapling.crossbreedingWeights[index] <= baseSapling.genes[index].crossbreedingWeight()
      ) {
        finalTargetSapling.addGene(baseSapling.genes[index]);
      } else {
        finalTargetSapling.addGene(gene);
      }
    });
    return finalTargetSapling;
  }

  /**
   * Method builds a mock sapling which shows if the gene on a given base sapling's position can be *ANY* or has to be green,
   * to achieve the red gene in target sapling.
   * This method is used to verify if it is actually allowed to have random sapling as a base.
   * 
   * Example: If on a first position of target sapling W is dominant with a weight of 1, but base gene 
   * has an X there - W will not be swapped as they both have same weights.
   * 
   * @returns A mock representation of base sapling.
   */
  buildBaseSaplingWithMockGenes(targetSapling: Sapling): Sapling {
    const baseSaplingMock = new Sapling();
    targetSapling.genes.forEach((gene, index) => {
      if (!gene.isGreen() && targetSapling.crossbreedingWeights[index] === 1) {
        baseSaplingMock.addGene(new Gene(GeneEnum.MG));
      } else {
        baseSaplingMock.addGene(new Gene(GeneEnum.MA));
      }
    });

    return baseSaplingMock;
  }
}

export default new CrossbreedingService();
