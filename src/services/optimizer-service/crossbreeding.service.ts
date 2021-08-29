import Sapling from '../../models/sapling.model';
import GeneEnum from '../../enums/gene.enum';
import Gene from '@/models/gene.model';

// TODO:
// objectify the crossbreeding process to maintain the crossbreeding weighting in the target sapling genes
// this needs to be used to know if the crossbreeding with base will override the red base gene and maybe also in future to improve base sapling information
class CrossbreedingService {
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
        [GeneEnum.B]: 0, // not in this context, but required by TS
        [GeneEnum.MG]: 0, // not in this context, but required by TS
        [GeneEnum.MA]: 0 // not in this context, but required by TS
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
      if (highestGeneWeight < 1) {
        winnerGeneTypes.push(GeneEnum.B);
      } else {
        Object.keys(geneToWeightMap).forEach((key) => {
          if (geneToWeightMap[key as GeneEnum] === highestGeneWeight) {
            winnerGeneTypes.push(key as GeneEnum);
          }
        });
      }

      winnerGeneTypes.forEach((geneType) => {
        crossbreedSaplings.forEach((sapling) => {
          if (sapling.genes[genePosition].type === geneType && involvedSaplings.indexOf(sapling) === -1) {
            involvedSaplings.push(sapling);
          }
        });
      });

      // ignore resulst where there is more then 2 results saplings
      if (targetSaplings.length > 1 && winnerGeneTypes.length > 1) {
        throw new Error('Ignore result set due to unexpected game behavior for saplings with < 50% chance.');
      }

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

  // used for overriding target sapling's B type genes with the base
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
