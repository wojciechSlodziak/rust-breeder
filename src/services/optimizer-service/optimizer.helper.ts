import GeneticsMap from '../../models/genetics-map.model';

export function sortResults(geneticsMap1: GeneticsMap, geneticsMap2: GeneticsMap): number {
  if (
    geneticsMap1.score > geneticsMap2.score ||
    (geneticsMap1.score === geneticsMap2.score && geneticsMap1.chancePercent > geneticsMap2.chancePercent)
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
  const maxItemsInVariation = Math.min(itemsCount, 8);
  for (let i = 2; i <= maxItemsInVariation; i++) {
    numberOfAllCombinations += rFact(itemsCount) / (rFact(i) * rFact(itemsCount - i));
  }
  return numberOfAllCombinations;
}

export function getWorkChunks(sourceSaplingsLength: number) {
  const allCombinationsCount = getNumberOfCrossbreedCombinations(sourceSaplingsLength);
  const numberOfWorkers = navigator.hardwareConcurrency - 1;
  const combinationsPerWorker = Math.ceil(allCombinationsCount / numberOfWorkers);

  const workChunks = [];

  let workerIndex = 0;
  let combinationsProcessed = 0;
  for (
    let crossbreedSaplingsCount = 2;
    crossbreedSaplingsCount <= Math.min(sourceSaplingsLength, 8);
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
        if (positions[positionIndexForInc] > sourceSaplingsLength - (crossbreedSaplingsCount - positionIndexForInc)) {
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
