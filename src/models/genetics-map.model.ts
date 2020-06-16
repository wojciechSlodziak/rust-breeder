import { Type } from 'class-transformer';
import Sapling from './sapling.model';

export default class GeneticsMap {
  @Type(() => Sapling)
  crossbreedSaplings!: Sapling[];

  @Type(() => Sapling)
  targetSapling!: Sapling;

  @Type(() => Sapling)
  baseSapling?: Sapling;

  score!: number;

  chancePercent!: number;
}
