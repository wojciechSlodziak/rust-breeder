import GeneEnum from '@/enums/gene.enum';

export default interface ApplicationOptions {
  allowRepetitions: boolean;
  includeAllResults: boolean;
  geneScores: Record<GeneEnum, number>;
}
