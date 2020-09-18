import 'reflect-metadata'; // TODO: why need this again here?
import Gene from './gene.model';
import GeneEnum from '../enums/gene.enum';

export default class Sapling {
  genes: Gene[];

  constructor(genes: Gene[] | string) {
    if (typeof genes === 'string') {
      this.genes = genes.split('').map((gene) => new Gene(gene as GeneEnum));
    } else {
      this.genes = genes;
    }
  }

  getScore(geneScores: Record<GeneEnum, number>): number {
    return Number(this.genes.reduce((acc, curr) => acc + geneScores[curr.type] || 0, 0).toFixed(2));
  }

  getNumberOfBaseGenes(): number {
    return this.genes.reduce((acc, curr) => acc + (curr.type === GeneEnum.B ? 1 : 0), 0);
  }

  toString() {
    return this.genes.map((gene) => gene.type).join('');
  }

  hasGreenGenes() {
    return this.genes.reduce((acc, gene) => acc || gene.isGreen, false);
  }

  toJSON() {
    return this.toString();
  }
}
