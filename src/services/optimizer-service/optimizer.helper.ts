import { MAX_CROSSBREEDING_SAPLINGS, MAX_SAME_RESULT_VARIANTS_IN_MAP, MIN_CROSSBREEDING_SAPLINGS } from '@/const';
import GeneticsMap from '../../models/genetics-map.model';
import Gene from '../../models/gene.model';
import Sapling from '../../models/sapling.model';
import { MapGroup } from './models';

export function resultMapsSortingFunction(geneticsMap1: GeneticsMap, geneticsMap2: GeneticsMap): number {
  if (
    geneticsMap1.score > geneticsMap2.score ||
    (geneticsMap1.score === geneticsMap2.score && geneticsMap1.chancePercent > geneticsMap2.chancePercent) ||
    (geneticsMap1.score === geneticsMap2.score &&
      geneticsMap1.chancePercent === geneticsMap2.chancePercent &&
      geneticsMap1.crossbreedSaplings.length < geneticsMap2.crossbreedSaplings.length)
  ) {
    return -1;
  } else {
    return 1;
  }
}

export function resultMapGroupsSortingFunction(geneticsMapsGroup1: MapGroup, geneticsMapsGroup2: MapGroup): number {
  if (
    geneticsMapsGroup1.mapList[0].score > geneticsMapsGroup2.mapList[0].score ||
    (geneticsMapsGroup1.mapList[0].score === geneticsMapsGroup2.mapList[0].score &&
      geneticsMapsGroup1.mapList[0].chancePercent > geneticsMapsGroup2.mapList[0].chancePercent)
  ) {
    return -1;
  } else {
    return 1;
  }
}

export function buildInitialSaplingPositions(positionCount: number, withRepetitions: boolean): number[] {
  const positions = [];
  for (let i = 0; i < positionCount; i++) {
    positions.push(withRepetitions ? 0 : i);
  }
  return positions;
}

function rFact(num: number): number {
  if (num === 0) {
    return 1;
  } else {
    return num * rFact(num - 1);
  }
}

export function getMaxPositionsCount(itemsCount: number, withRepetitions: boolean) {
  return withRepetitions ? MAX_CROSSBREEDING_SAPLINGS : Math.min(itemsCount, MAX_CROSSBREEDING_SAPLINGS);
}

export function getNumberOfCrossbreedCombinations(itemsCount: number, withRepetitions: boolean) {
  let numberOfAllCombinations = 0;
  const maxItemsInVariation = getMaxPositionsCount(itemsCount, withRepetitions);
  for (let k = MIN_CROSSBREEDING_SAPLINGS; k <= maxItemsInVariation; k++) {
    if (withRepetitions) {
      numberOfAllCombinations += rFact(k + itemsCount - 1) / (rFact(k) * rFact(itemsCount - 1));
    } else {
      numberOfAllCombinations += rFact(itemsCount) / (rFact(k) * rFact(itemsCount - k));
    }
  }
  return numberOfAllCombinations;
}

/**
 * Sets next position for crossbreeding.
 * @return True if there's more combinations to go through.
 */
export function setNextPosition(
  positions: number[],
  currentPositionIndexForInc: number,
  positionCount: number,
  sourceSaplingsCount: number,
  withRepetitions: boolean
): { nextPositionIndexForInc: number; hasMoreCombinations: boolean } {
  let hasMoreCombinations = true;
  let keepOriganizingPositions = true;
  while (keepOriganizingPositions) {
    positions[currentPositionIndexForInc] += 1;

    // Example:
    // For no repetitions consider 3 possible positions and 8 source saplings.
    // Last position is [5, 6, 7], and following calculation has to be done:
    // - to calculate max on third position: 8 - (3 - 2)
    // - to calculate max on second position: 8 - (3 - 1)
    // - to calculate max on first position: 8 - (3 - 0)
    const maxSaplingIndexOnCurrentPosition = withRepetitions
      ? sourceSaplingsCount - 1
      : sourceSaplingsCount - (positionCount - currentPositionIndexForInc);

    // If maximum has been reached on a position, it's time to:
    // - increment previous position,
    // - check if it didn't already pass maximum, if so run above step again,
    // - reset following positions,
    // - start incrementing again at the last position.
    if (positions[currentPositionIndexForInc] > maxSaplingIndexOnCurrentPosition) {
      if (currentPositionIndexForInc === 0) {
        hasMoreCombinations = false;
        keepOriganizingPositions = false;
      } else {
        currentPositionIndexForInc -= 1;
      }
    } else {
      for (let positionIndex = currentPositionIndexForInc + 1; positionIndex < positions.length; positionIndex++) {
        positions[positionIndex] = positions[positionIndex - 1] + (withRepetitions ? 0 : 1);
      }
      currentPositionIndexForInc = positionCount - 1;
      keepOriganizingPositions = false;
    }
  }

  return {
    nextPositionIndexForInc: currentPositionIndexForInc,
    hasMoreCombinations
  };
}

/**
 * Method calculates chunks of work which should be split between workers.
 * @param sourceSaplingsCount Number of sourceSaplings provided by User.
 * @param withRepetitions Option defining if process should consider repetitions.
 * @returns List of objects which represent chunks of work.
 */
export function getWorkChunks(sourceSaplingsCount: number, withRepetitions: boolean) {
  const allCombinationsCount = getNumberOfCrossbreedCombinations(sourceSaplingsCount, withRepetitions);
  const numberOfWorkers = navigator.hardwareConcurrency;
  const combinationsPerWorker = Math.ceil(allCombinationsCount / numberOfWorkers);
  const workChunks = [];

  let workerIndex = 0;
  let combinationsProcessed = 0;
  for (
    let positionCount = MIN_CROSSBREEDING_SAPLINGS;
    positionCount <= getMaxPositionsCount(sourceSaplingsCount, withRepetitions);
    positionCount++
  ) {
    const positions = buildInitialSaplingPositions(positionCount, withRepetitions);

    let positionIndexForInc = positionCount - 1;
    let hasMoreCombinations = true;
    while (hasMoreCombinations) {
      if (combinationsProcessed === 0) {
        workChunks[workerIndex] = {
          startingPositions: [...positions],
          combinationsToProcess: 0,
          allCombinationsCount
        };
      }

      const setNextPositionResult = setNextPosition(
        positions,
        positionIndexForInc,
        positionCount,
        sourceSaplingsCount,
        withRepetitions
      );
      hasMoreCombinations = setNextPositionResult.hasMoreCombinations;
      positionIndexForInc = setNextPositionResult.nextPositionIndexForInc;

      combinationsProcessed++;
      workChunks[workerIndex].combinationsToProcess = combinationsProcessed;
      if (
        hasMoreCombinations &&
        workerIndex !== numberOfWorkers - 1 &&
        combinationsProcessed >= combinationsPerWorker
      ) {
        combinationsProcessed = 0;
        workerIndex++;
      }
    }
  }

  return workChunks;
}

export function appendListToMapGroupsMap(mapGroupMap: { [key: string]: MapGroup }, mapList: GeneticsMap[]): void {
  mapList.forEach((geneticsMap) => {
    const resultSaplingGeneString = geneticsMap.resultSapling.genes.map((gene) => gene.type.toString()).join('');
    if (mapGroupMap[resultSaplingGeneString] === undefined) {
      mapGroupMap[resultSaplingGeneString] = {
        resultSaplingGeneString,
        mapList: [geneticsMap]
      };
    } else {
      mapGroupMap[resultSaplingGeneString].mapList.push(geneticsMap);
    }

    mapGroupMap[resultSaplingGeneString].mapList.sort(resultMapsSortingFunction);
    // discards results if there is more than MAX_SAME_RESULT_VARIANTS_IN_MAP maps for the same resultSapling
    mapGroupMap[resultSaplingGeneString].mapList = [
      ...mapGroupMap[resultSaplingGeneString].mapList.splice(0, MAX_SAME_RESULT_VARIANTS_IN_MAP)
    ];
  });
}

/**
 * Fixes Prototype assignments after worker serialization to make sure that all the Class methods are accessible.
 * @param mapList List of results, that require prototype fixes.
 */
export function fixPrototypeAssignmentsAfterSerialization(mapList: GeneticsMap[]) {
  mapList.forEach((map) => {
    Object.setPrototypeOf(map.resultSapling, Sapling.prototype);
    map.resultSapling.genes.forEach((gene) => {
      Object.setPrototypeOf(gene, Gene.prototype);
    });
    map.crossbreedSaplings.forEach((crossbreedSapling) => {
      Object.setPrototypeOf(crossbreedSapling, Sapling.prototype);
      crossbreedSapling.genes.forEach((gene) => {
        Object.setPrototypeOf(gene, Gene.prototype);
      });
    });
    if (map.baseSapling) {
      Object.setPrototypeOf(map.baseSapling, Sapling.prototype);
      map.baseSapling.genes.forEach((gene) => {
        Object.setPrototypeOf(gene, Gene.prototype);
      });
    }
  });
}
