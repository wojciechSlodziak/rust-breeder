import GeneEnum from '@/enums/gene.enum';

export default interface ApplicationOptions {
  withRepetitions: boolean;
  includeAllResults: boolean;
  geneScores: Record<GeneEnum, number>;
}
