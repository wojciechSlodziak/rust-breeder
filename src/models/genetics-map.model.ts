import Sapling from './sapling.model';

export default class GeneticsMap {
  crossbreedSaplings!: Sapling[];

  targetSapling!: Sapling;

  baseSapling?: Sapling;

  score!: number;

  chancePercent!: number;
}
