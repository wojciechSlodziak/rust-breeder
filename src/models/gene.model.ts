import GeneEnum from '../enums/gene.enum';

export default class Gene {
  type: GeneEnum;

  constructor(type: GeneEnum) {
    this.type = type;
  }

  isGreen(): boolean {
    return [GeneEnum.G, GeneEnum.H, GeneEnum.Y].indexOf(this.type) !== -1;
  }

  getCrossbreedingWeight() {
    return this.isGreen() ? 0.6 : 1;
  }
}
