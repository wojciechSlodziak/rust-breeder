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

export function getWorkChunks(sourceSaplingsCount: number) {
  const allCombinationsCount = getNumberOfCrossbreedCombinations(sourceSaplingsCount);
  const numberOfWorkers = navigator.hardwareConcurrency - 1;
  const combinationsPerWorker = Math.ceil(allCombinationsCount / numberOfWorkers);

  const workChunks = [];

  let workerIndex = 0;
  let combinationsProcessed = 0;
  for (
    let crossbreedSaplingsCount = MIN_CROSSBREEDING_SAPLINGS;
    crossbreedSaplingsCount <= Math.min(sourceSaplingsCount, MAX_CROSSBREEDING_SAPLINGS);
    crossbreedSaplingsCount++
  ) {
    const positions = buildInitialSaplingPositions(crossbreedSaplingsCount);

    let positionIndexForInc = crossbreedSaplingsCount - 1;
    let hasCombinations = true;
    while (hasCombinations) {
      if (combinationsProcessed === 0) {
        workChunks[workerIndex] = {
          startingPositions: [...positions],
          combinationsToProcess: 0
        };
      }

      let keepOriganizingPositions = true;
      while (keepOriganizingPositions) {
        positions[positionIndexForInc] += 1;
        if (positions[positionIndexForInc] > sourceSaplingsCount - (crossbreedSaplingsCount - positionIndexForInc)) {
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
      workChunks[workerIndex].combinationsToProcess = combinationsProcessed;
      if (hasCombinations && workerIndex !== numberOfWorkers - 1 && combinationsProcessed >= combinationsPerWorker) {
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
