import Sapling from './models/sapling.model';
import GeneEnum from './enums/gene.enum';

class CrossbreedingService {
  crossbreed(crossbreedSaplings: Sapling[]): Sapling[] {
    let partialGenes: string[] = [''];
    for (let genePosition = 0; genePosition < 6; genePosition++) {
      const geneToWeightMap: Record<GeneEnum, number> = {
        [GeneEnum.G]: 0,
        [GeneEnum.Y]: 0,
        [GeneEnum.H]: 0,
        [GeneEnum.X]: 0,
        [GeneEnum.W]: 0,
        [GeneEnum.B]: 0
      };
      crossbreedSaplings.forEach((crossbreedSapling) => {
        geneToWeightMap[crossbreedSapling.genes[genePosition].type] =
          (geneToWeightMap[crossbreedSapling.genes[genePosition].type]
            ? geneToWeightMap[crossbreedSapling.genes[genePosition].type]
            : 0) + crossbreedSapling.genes[genePosition].getCrossbreedingWeight();
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

      const newPartialGenes: string[] = [];
      partialGenes.forEach((newGenes) => {
        winnerGeneTypes.forEach((winnerGeneType) => {
          newPartialGenes.push(`${newGenes}${winnerGeneType}`);
        });
      });
      partialGenes = newPartialGenes;
    }

    return partialGenes.map((finalGenes) => new Sapling(finalGenes));
  }

  // used for overriding target sapling's B type genes with the base
  crossbreedTargetWithBase(targetSapling: Sapling, baseSapling: Sapling) {
    let newGenes = '';
    targetSapling.genes.forEach((gene, index) => {
      newGenes = `${newGenes}${gene.type === GeneEnum.B ? baseSapling.genes[index].type : gene.type}`;
    });
    return new Sapling(newGenes);
  }
}

export default new CrossbreedingService();