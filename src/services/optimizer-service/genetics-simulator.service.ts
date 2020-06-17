import GeneticsMap from '../../models/genetics-map.model';
import Sapling from '../../models/sapling.model';
import crossbreedingService from './crossbreeding.service';
import {
  sortResults,
  buildInitialSaplingPositions,
  resetFollowingPositions,
  getNumberOfCrossbreedCombinations
} from './optimizer.helper';
import GeneEnum from '../../enums/gene.enum';

interface SimulateOptions {
  progressCallback: (percentDone: number) => void;
  callProgressCallbackAfterCombinations: number;
  geneScores: Record<GeneEnum, number>;
}

class GeneticsSimulatorService {
  simulateCrossbreeding(sourceGenes: string[], options: SimulateOptions): GeneticsMap[] {
    const sourceSaplings: Sapling[] = sourceGenes.map((singleGenes) => new Sapling(singleGenes));
    let result: GeneticsMap[] = [];

    const originalBestScore = this.getOriginalBestScore(sourceSaplings, options.geneScores);

    const allCombinationsCount = getNumberOfCrossbreedCombinations(sourceSaplings.length);

    let combinationsProcessed = 0;
    for (
      let crossbreedSaplingsCount = 2;
      crossbreedSaplingsCount <= Math.min(sourceSaplings.length, 8);
      crossbreedSaplingsCount++
    ) {
      const positions = buildInitialSaplingPositions(crossbreedSaplingsCount);
      let positionIndexForInc = crossbreedSaplingsCount - 1;
      let hasCombinations = true;
      while (hasCombinations) {
        const crossbreedSaplings: Sapling[] = [];
        positions.forEach((position) => {
          crossbreedSaplings.push(sourceSaplings[position]);
        });

        this.performCrossbreedingAndScoring(
          result,
          sourceSaplings,
          crossbreedSaplings,
          originalBestScore,
          options.geneScores
        );

        let keepOriganizingPositions = true;
        while (keepOriganizingPositions) {
          positions[positionIndexForInc] += 1;
          if (
            positions[positionIndexForInc] >
            sourceSaplings.length - (crossbreedSaplingsCount - positionIndexForInc)
          ) {
            if (positionIndexForInc === 0) {
              hasCombinations = false;
              keepOriganizingPositions = false;
            } else {
              positionIndexForInc -= 1;
            }
          } else {
            resetFollowingPositions(positions, positionIndexForInc);
            positionIndexForInc = crossbreedSaplingsCount - 1;
            keepOriganizingPositions = false;
          }
        }

        combinationsProcessed++;
        if (options && combinationsProcessed % options.callProgressCallbackAfterCombinations === 0) {
          options.progressCallback(Number(((combinationsProcessed / allCombinationsCount) * 100).toFixed(2)));
        }
      }
    }

    result = result.filter((map) => sourceGenes.indexOf(map.targetSapling.toString()) === -1);

    result.sort(sortResults);
    return result;
  }

  private performCrossbreedingAndScoring(
    result: GeneticsMap[],
    sourceSaplings: Sapling[],
    crossbreedSaplings: Sapling[],
    originalBestScore: number,
    geneScores: Record<GeneEnum, number>
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

          if (rebreedTargetSapling.getScore(geneScores) >= originalBestScore) {
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
        if (targetSapling.getScore(geneScores) >= originalBestScore) {
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
