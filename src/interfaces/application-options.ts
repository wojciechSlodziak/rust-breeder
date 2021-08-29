import GeneEnum from '@/enums/gene.enum';

export default interface ApplicationOptions {
  withRepetitions: boolean;
  includeResultsWithMinimumScore: boolean;
  minimumScore: number;
  geneScores: Record<GeneEnum, number>;
}
