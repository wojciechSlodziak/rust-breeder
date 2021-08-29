import GeneEnum from '../enums/gene.enum';

export default class Gene {
  type: GeneEnum;

  constructor(type: GeneEnum) {
    this.type = type;
  }

  isGreen(): boolean {
    return [GeneEnum.G, GeneEnum.H, GeneEnum.Y, GeneEnum.MG].indexOf(this.type) !== -1;
  }

  isRed(): boolean {
    return [GeneEnum.X, GeneEnum.W].indexOf(this.type) !== -1;
  }

  toString(): string {
    return [GeneEnum.MG, GeneEnum.MA].indexOf(this.type) === -1 ? this.type : '';
  }

  crossbreedingWeight(): number {
    return this.isGreen() ? 0.6 : 1;
  }
}
