import GeneticsMap from './models/genetics-map.model';

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
