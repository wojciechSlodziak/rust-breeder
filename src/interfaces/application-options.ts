import GeneEnum from '@/enums/gene.enum';

export default interface ApplicationOptions {
  includeAllResults: boolean;
  geneScores: Record<GeneEnum, number>;
}
