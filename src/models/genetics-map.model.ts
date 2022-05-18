import Sapling from './sapling.model';

export default class GeneticsMap {
  crossbreedSaplings!: Sapling[];

  crossbreedSaplingsVariants?: GeneticsMap[];

  resultSapling!: Sapling;

  baseSapling?: Sapling;

  score!: number;

  chancePercent!: number;
}
