import GeneEnum from '../enums/gene.enum';

const SCORE_MAP = {
  [GeneEnum.G]: 1,
  [GeneEnum.Y]: 1,
  [GeneEnum.H]: 0.2,
  [GeneEnum.X]: 0,
  [GeneEnum.W]: -0.2,
  [GeneEnum.B]: 0
};

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

  getScore(): number {
    return SCORE_MAP[this.type] || 0;
  }
}
