import Sapling from './sapling.model';

export default class GeneticsMap {
  crossbreedingSaplings!: Sapling[];

  crossbreedingSaplingsVariants?: GeneticsMap[];

  resultSapling!: Sapling;

  baseSapling?: Sapling;

  score!: number;

  chancePercent!: number;
}
