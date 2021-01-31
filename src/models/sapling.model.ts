import 'reflect-metadata';
import Gene from './gene.model';
import GeneEnum from '../enums/gene.enum';

export default class Sapling {
  genes: Gene[];
  numberOfGs: number;
  numberOfYs: number;
  numberOfHs: number;
  [key: string]: unknown;

  constructor(genes: Gene[] | string) {
    if (typeof genes === 'string') {
      this.genes = genes.split('').map((gene) => new Gene(gene as GeneEnum));
    } else {
      this.genes = genes;
    }

    this.numberOfGs = this.genes.reduce((acc, gene) => acc + (gene.type === GeneEnum.G ? 1 : 0), 0);
    this.numberOfYs = this.genes.reduce((acc, gene) => acc + (gene.type === GeneEnum.Y ? 1 : 0), 0);
    this.numberOfHs = this.genes.reduce((acc, gene) => acc + (gene.type === GeneEnum.H ? 1 : 0), 0);
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
