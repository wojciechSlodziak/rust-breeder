import 'reflect-metadata';
import Gene from './gene.model';
import GeneEnum from '../enums/gene.enum';

export default class Sapling {
  genes: Gene[];
  /**
   * property used for keeping the track of weight of the genes after crossbreeding,
   * required for rebreeding with base, and for indicating correct base for red gene outcomes (example: single X can't override W, but can override G)
   */
  crossbreedingWeights: number[];
  numberOfGs: number;
  numberOfYs: number;
  numberOfHs: number;
  [key: string]: unknown;

  constructor(genes: Gene[] | string | null = null) {
    if (typeof genes === 'string') {
      this.genes = genes.split('').map((gene) => new Gene(gene as GeneEnum));
    } else if (genes !== null) {
      this.genes = genes;
    } else {
      this.genes = [];
    }

    if (this.genes.length !== 0) {
      this.setNumbersOfGenes();
    }
  }

  addGene(gene: Gene, weight: number | undefined = undefined) {
    this.genes.push(gene);
    if (weight) {
      if (!this.crossbreedingWeights) {
        this.crossbreedingWeights = [];
      }
      this.crossbreedingWeights.push(weight);
    }

    if (this.genes.length === 6) {
      this.setNumbersOfGenes();
    }
  }

  setNumbersOfGenes() {
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

  hasRedGenesWithLowestWeight() {
    return this.genes.some((gene, index) => !gene.isGreen && this.crossbreedingWeights[index] === 1);
  }

  toString() {
    return this.genes.map((gene) => gene.type).join('');
  }

  hasGreenGenes() {
    return this.genes.reduce((acc, gene) => acc || gene.isGreen, false);
  }

  clone(): Sapling {
    const cloneSapling = new Sapling();
    cloneSapling.genes = [...this.genes];
    cloneSapling.crossbreedingWeights = [...this.crossbreedingWeights];
    if (cloneSapling.genes.length === 6) {
      cloneSapling.setNumbersOfGenes();
    }
    return cloneSapling;
  }

  toJSON() {
    return this.toString();
  }
}
