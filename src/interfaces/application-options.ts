import GeneEnum from '@/enums/gene.enum';

export default interface ApplicationOptions {
  geneScores: Record<GeneEnum, number>;
}
