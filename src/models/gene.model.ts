import GeneEnum from '../enums/gene.enum';

export default class Gene {
  type: GeneEnum;
  isGreen: boolean;
  crossbreedingWeight: number;

  constructor(type: GeneEnum) {
    this.type = type;
    this.isGreen = [GeneEnum.G, GeneEnum.H, GeneEnum.Y].indexOf(this.type) !== -1;
    this.crossbreedingWeight = this.isGreen ? 0.6 : 1;
  }
}
