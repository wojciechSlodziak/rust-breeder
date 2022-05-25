import GeneEnum from '../enums/gene.enum';

export default class Gene {
  type: GeneEnum;
  isGreen: boolean;

  constructor(type: GeneEnum) {
    this.type = type;
    this.isGreen = [GeneEnum.G, GeneEnum.H, GeneEnum.Y].indexOf(this.type) !== -1;
  }

  getCrossbreedingWeight(): number {
    return this.isGreen ? 0.6 : 1;
  }
}
