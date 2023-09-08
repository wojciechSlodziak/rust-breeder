import GeneEnum from '../enums/gene.enum';

export const GREEN_GENE_WEIGHT = 0.6;
export const RED_GENE_WEIGHT = 1;

export default class Gene {
  type: GeneEnum;
  isGreen: boolean;

  constructor(type: GeneEnum) {
    this.type = type;
    this.isGreen = [GeneEnum.G, GeneEnum.H, GeneEnum.Y].indexOf(this.type) !== -1;
  }

  getCrossbreedingWeight(): number {
    return this.isGreen ? GREEN_GENE_WEIGHT : RED_GENE_WEIGHT;
  }
}
