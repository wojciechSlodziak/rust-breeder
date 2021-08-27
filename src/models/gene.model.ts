import GeneEnum from '../enums/gene.enum';

export default class Gene {
  type: GeneEnum;
  isGreen: boolean;
  isRed: boolean;
  text: string;
  crossbreedingWeight: number;

  constructor(type: GeneEnum) {
    this.type = type;
    this.isGreen = [GeneEnum.G, GeneEnum.H, GeneEnum.Y, GeneEnum.MG].indexOf(this.type) !== -1;
    this.isRed = [GeneEnum.X, GeneEnum.W].indexOf(this.type) !== -1;
    this.text = [GeneEnum.MG, GeneEnum.MA].indexOf(this.type) === -1 ? this.type : '';
    this.crossbreedingWeight = this.isGreen ? 0.6 : 1;
  }
}
