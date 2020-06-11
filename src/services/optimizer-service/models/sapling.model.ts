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

  getScore(): number {
    return this.genes.reduce((acc, curr) => acc + curr.getScore(), 0);
  }

  getNumberOfBaseGenes(): number {
    return this.genes.reduce((acc, curr) => acc + (curr.type === GeneEnum.B ? 1 : 0), 0);
  }

  toString() {
    return this.genes.map((gene) => gene.type).join('');
  }

  toJSON() {
    return this.toString();
  }
}
