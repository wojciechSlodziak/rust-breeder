import Sapling from '@/models/sapling.model';
import { GenerationInfo, GeneticsMap, SimulateOptions } from '@/services/crossbreeding-service/models';
import crossbreedingService from '@/services/crossbreeding-service/crossbreeding.service';
import GeneEnum from '@/enums/gene.enum';
import {
  buildInitialSaplingPositions,
  getNumberOfCrossbreedingCombinations
} from '@/services/crossbreeding-service/helper';

describe('crossbreedingService', () => {
  it('calculates valid crossbreeding results', () => {
    const sapling1Genes = 'GGGYYH';
    const sourceSaplings = [sapling1Genes, 'XGHGWY', 'HGGGYH'].map((genes) => new Sapling(genes));
    const withRepetitions = true;
    const minCrossbreedingSaplingsNumber = 2;
    const maxCrossbreedingSaplingsNumber = 8;

    const startingPositions = buildInitialSaplingPositions(minCrossbreedingSaplingsNumber, withRepetitions);
    const combinationsToProcess = getNumberOfCrossbreedingCombinations(
      sourceSaplings.length,
      withRepetitions,
      minCrossbreedingSaplingsNumber,
      maxCrossbreedingSaplingsNumber
    );
    const generationInfo: GenerationInfo = { index: 1 };

    let totalCombinationsProcessed = 0;
    let totalResults = 0;
    let resultSaplingStrings: string[] = [];

    const options: SimulateOptions = {
      progressCallback: (combinationsProcessed: number, partialResultMapList: GeneticsMap[]) => {
        totalCombinationsProcessed += combinationsProcessed;
        totalResults += partialResultMapList.length;
        resultSaplingStrings = [
          ...resultSaplingStrings,
          ...partialResultMapList.map((result) => result.resultSapling.toString())
        ];
      },
      callProgressCallbackAfterCombinations: 100,
      callProgressCallbackAfterNumberOfResultsReached: 5,
      minCrossbreedingSaplingsNumber,
      maxCrossbreedingSaplingsNumber,
      numberOfSaplingsAddedBetweenGenerations: 10,
      geneScores: {
        [GeneEnum.G]: 1,
        [GeneEnum.Y]: 1,
        [GeneEnum.H]: 0.5,
        [GeneEnum.X]: 0,
        [GeneEnum.W]: 0
      },
      withRepetitions,
      minimumTrackedScore: 3
    };
    crossbreedingService.simulateCrossbreeding(
      sourceSaplings,
      startingPositions,
      combinationsToProcess,
      generationInfo,
      options
    );

    expect(totalCombinationsProcessed).toBe(combinationsToProcess);
    expect(totalResults).toBeGreaterThan(0);
    expect(resultSaplingStrings).toContain('GGGGYH');
    expect(resultSaplingStrings).toContain('XGGYYH');
    expect(resultSaplingStrings).not.toContain(sapling1Genes);
    expect(resultSaplingStrings).not.toContain('YYYYYY');
  });
});
