import { MAX_CROSSBREEDING_SAPLINGS, MAX_SAME_TARGET_RESULTS_IN_MAP, MIN_CROSSBREEDING_SAPLINGS } from '@/const';
import GeneticsMap from '../../models/genetics-map.model';
import { MapGroup } from './models';

export function resultMapsSortingFunction(geneticsMap1: GeneticsMap, geneticsMap2: GeneticsMap): number {
  if (
    geneticsMap1.score > geneticsMap2.score ||
    (geneticsMap1.score === geneticsMap2.score && geneticsMap1.chancePercent > geneticsMap2.chancePercent)
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

export function buildInitialSaplingPositions(positionCount: number): number[] {
  const positions = [];
  for (let i = 0; i < positionCount; i++) {
    positions.push(i);
  }
  return positions;
}

export function resetFollowingPositions(positions: number[], fromPosition: number): void {
  for (let positionIndex = fromPosition + 1; positionIndex < positions.length; positionIndex++) {
    positions[positionIndex] = positions[positionIndex - 1] + 1;
  }
}

function rFact(num: number): number {
  if (num === 0) {
    return 1;
  } else {
    return num * rFact(num - 1);
  }
}

export function getNumberOfCrossbreedCombinations(itemsCount: number) {
  let numberOfAllCombinations = 0;
  const maxItemsInVariation = Math.min(itemsCount, MAX_CROSSBREEDING_SAPLINGS);
  for (let i = MIN_CROSSBREEDING_SAPLINGS; i <= maxItemsInVariation; i++) {
    numberOfAllCombinations += rFact(itemsCount) / (rFact(i) * rFact(itemsCount - i));
  }
  return numberOfAllCombinations;
}

/**
 * Sets next position for crossbreeding.
 * @return true if there's more combinations to go through
 */
export function setNextPosition(
  positions: number[],
  currentPositionIndexForInc: number,
  positionCount: number,
  sourceSaplingsCount: number
): { nextPositionIndexForInc: number; hasMoreCombinations: boolean } {
  let hasMoreCombinations = true;
  let keepOriganizingPositions = true;
  while (keepOriganizingPositions) {
    positions[currentPositionIndexForInc] += 1;
    // consider 3 possible positions and 8 source saplings
    // last position is [5, 6, 7], following calculation has to be done:
    // - to calculate max on third position: 8 - (3 - 2)
    // - to calculate max on second position: 8 - (3 - 1)
    // - to calculate max on first position: 8 - (3 - 0)
    const maxSaplingIndexOnCurrentPosition = sourceSaplingsCount - (positionCount - currentPositionIndexForInc);
    // if maximum has been reached on a position, it's time to:
    // - increment previous position
    // - check if it didn't already pass maximum, if so run above step again
    // - reset following positions,
    // - start incrementing again at the last position
    if (positions[currentPositionIndexForInc] > maxSaplingIndexOnCurrentPosition) {
      if (currentPositionIndexForInc === 0) {
        hasMoreCombinations = false;
        keepOriganizingPositions = false;
      } else {
        currentPositionIndexForInc -= 1;
      }
    } else {
      resetFollowingPositions(positions, currentPositionIndexForInc);
      currentPositionIndexForInc = positionCount - 1;
      keepOriganizingPositions = false;
    }
  }

  return {
    nextPositionIndexForInc: currentPositionIndexForInc,
    hasMoreCombinations
  };
}

export function getWorkChunks(sourceSaplingsCount: number) {
  const allCombinationsCount = getNumberOfCrossbreedCombinations(sourceSaplingsCount);
  const numberOfWorkers = navigator.hardwareConcurrency;
  const combinationsPerWorker = Math.ceil(allCombinationsCount / numberOfWorkers);
  const workChunks = [];

  let workerIndex = 0;
  let combinationsProcessed = 0;
  for (
    let positionCount = MIN_CROSSBREEDING_SAPLINGS;
    positionCount <= Math.min(sourceSaplingsCount, MAX_CROSSBREEDING_SAPLINGS);
    positionCount++
  ) {
    const positions = buildInitialSaplingPositions(positionCount);

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

      const setNextPositionResult = setNextPosition(positions, positionIndexForInc, positionCount, sourceSaplingsCount);
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
    const targetSaplingGeneString = geneticsMap.targetSapling.genes.map((gene) => gene.type.toString()).join('');
    if (mapGroupMap[targetSaplingGeneString] === undefined) {
      mapGroupMap[targetSaplingGeneString] = {
        targetSaplingGeneString,
        mapList: [geneticsMap]
      };
    } else {
      mapGroupMap[targetSaplingGeneString].mapList.push(geneticsMap);
    }

    mapGroupMap[targetSaplingGeneString].mapList.sort(resultMapsSortingFunction);
    // discards results if there is more than 15 maps for the same targetSapling
    mapGroupMap[targetSaplingGeneString].mapList = [
      ...mapGroupMap[targetSaplingGeneString].mapList.splice(0, MAX_SAME_TARGET_RESULTS_IN_MAP)
    ];
  });
}
