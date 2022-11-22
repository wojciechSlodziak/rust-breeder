import 'reflect-metadata';
import Gene from './gene.model';
import GeneEnum from '../enums/gene.enum';

export default class Sapling {
  genes: Gene[];
  generationIndex: number;
  /**
   * Only applies to Saplings that are provided by the User.
   * Corresponds to the order of Saplings as provided in the input.
   */
  index?: number;
  [key: string]: unknown;

  constructor(genes: Gene[] | string | null = null, generationIndex = 0, index?: number) {
    this.generationIndex = generationIndex;
    this.index = index;
    if (typeof genes === 'string') {
      this.genes = genes.split('').map((gene) => new Gene(gene as GeneEnum));
    } else if (genes !== null) {
      this.genes = genes;
    } else {
      this.genes = [];
    }
  }

  addGene(gene: Gene) {
    this.genes.push(gene);
  }

  numberOfGs() {
    return this.genes.reduce((acc, gene) => acc + (gene.type === GeneEnum.G ? 1 : 0), 0);
  }

  numberOfYs() {
    return this.genes.reduce((acc, gene) => acc + (gene.type === GeneEnum.Y ? 1 : 0), 0);
  }

  numberOfHs() {
    return this.genes.reduce((acc, gene) => acc + (gene.type === GeneEnum.H ? 1 : 0), 0);
  }

  getScore(geneScores: Record<GeneEnum, number>): number {
    return Number(this.genes.reduce((acc, curr) => acc + geneScores[curr.type] || 0, 0).toFixed(2));
  }

  toString() {
    return this.genes.map((gene) => gene.type).join('');
  }

  clone(): Sapling {
    return new Sapling([...this.genes], this.generationIndex, this.index);
  }
}
