import GeneticsMap from '../../models/genetics-map.model';
import Sapling from '../../models/sapling.model';
import crossbreedingService from './crossbreeding.service';
import { buildInitialSaplingPositions, resetFollowingPositions, setNextPosition } from './optimizer.helper';
import GeneEnum from '../../enums/gene.enum';
import { SimulateOptions } from './models';
import { MAX_CROSSBREEDING_SAPLINGS } from '@/const';

class GeneticsSimulatorService {
  simulateCrossbreeding(
    sourceGenes: string[],
    startingPositions: number[],
    combinationsToProcess: number,
    options: SimulateOptions
  ): GeneticsMap[] {
    const sourceSaplings: Sapling[] = sourceGenes.map((singleGenes) => new Sapling(singleGenes));
    let result: GeneticsMap[] = [];

    const originalBestScore = this.getOriginalBestScore(sourceSaplings, options.geneScores);

    let combinationsProcessed = 0;
    for (
      let positionCount = startingPositions.length;
      positionCount <= Math.min(sourceSaplings.length, MAX_CROSSBREEDING_SAPLINGS);
      positionCount++
    ) {
      const positions =
        positionCount === startingPositions.length ? startingPositions : buildInitialSaplingPositions(positionCount);
      let positionIndexForInc = positionCount - 1;
      let hasMoreCombinations = true;
      while (hasMoreCombinations) {
        const crossbreedSaplings: Sapling[] = [];
        positions.forEach((position) => {
          crossbreedSaplings.push(sourceSaplings[position]);
        });

        this.performCrossbreedingAndScoring(
          result,
          sourceSaplings,
          crossbreedSaplings,
          originalBestScore,
          options.geneScores,
          options.includeAllResults
        );

        const setNextPositionResult = setNextPosition(
          positions,
          positionIndexForInc,
          positionCount,
          sourceSaplings.length
        );
        hasMoreCombinations = setNextPositionResult.hasMoreCombinations;
        positionIndexForInc = setNextPositionResult.nextPositionIndexForInc;

        combinationsProcessed++;
        if (options && combinationsProcessed % options.callProgressCallbackAfterCombinations === 0) {
          options.progressCallback(combinationsProcessed);
        }

        if (combinationsProcessed === combinationsToProcess) {
          result = result.filter((map) => sourceGenes.indexOf(map.targetSapling.toString()) === -1);
          return result;
        }
      }
    }

    return [];
  }

  private performCrossbreedingAndScoring(
    result: GeneticsMap[],
    sourceSaplings: Sapling[],
    crossbreedSaplings: Sapling[],
    originalBestScore: number,
    geneScores: Record<GeneEnum, number>,
    includeAllResults: boolean
  ) {
    let targetSaplings: Sapling[] = [];
    try {
      targetSaplings = crossbreedingService.crossbreed(crossbreedSaplings);
    } catch (e) {
      // do nothing!
    }

    targetSaplings.forEach((targetSapling) => {
      const numberOfBaseGenes = targetSapling.getNumberOfBaseGenes();

      if (numberOfBaseGenes > 0 && numberOfBaseGenes < 6) {
        const otherSaplings: Sapling[] = sourceSaplings.filter((sapling) => crossbreedSaplings.indexOf(sapling) === -1);
        otherSaplings.forEach((baseSapling) => {
          const rebreedTargetSapling = crossbreedingService.crossbreedTargetWithBase(targetSapling, baseSapling);

          if (
            rebreedTargetSapling.getScore(geneScores) >= originalBestScore ||
            (includeAllResults === true && rebreedTargetSapling.hasGreenGenes())
          ) {
            result.push({
              crossbreedSaplings,
              baseSapling,
              targetSapling: rebreedTargetSapling,
              score: rebreedTargetSapling.getScore(geneScores),
              chancePercent: Number((100 / targetSaplings.length).toFixed(2))
            });
          }
        });
      } else if (numberOfBaseGenes === 0) {
        if (
          targetSapling.getScore(geneScores) >= originalBestScore ||
          (includeAllResults === true && targetSapling.hasGreenGenes())
        ) {
          result.push({
            crossbreedSaplings,
            targetSapling,
            score: targetSapling.getScore(geneScores),
            chancePercent: Number((100 / targetSaplings.length).toFixed(2))
          });
        }
      }
    });
  }

  private getOriginalBestScore(sourceSaplings: Sapling[], geneScores: Record<GeneEnum, number>) {
    let currentScore = Number.MIN_VALUE;
    sourceSaplings.forEach((sapling) => {
      const saplingScore = sapling.getScore(geneScores);
      currentScore = saplingScore > currentScore ? saplingScore : currentScore;
    });
    return currentScore;
  }
}

export default new GeneticsSimulatorService();
