import GeneEnum from '@/enums/gene.enum';
import Gene from '../../models/gene.model';
import Sapling from '../../models/sapling.model';
import { GeneticsMap, GeneticsMapGroup } from './models';

/**
 * Used for sorting Maps that yield the same result Sapling.
 */
export function resultMapsSortingFunction(geneticsMap1: GeneticsMap, geneticsMap2: GeneticsMap): number {
  if (
    geneticsMap1.resultSapling.generationIndex < geneticsMap2.resultSapling.generationIndex ||
    (geneticsMap1.resultSapling.generationIndex === geneticsMap2.resultSapling.generationIndex &&
      (geneticsMap1.chancePercent > geneticsMap2.chancePercent ||
        (geneticsMap1.chancePercent === geneticsMap2.chancePercent &&
          (geneticsMap1.sumOfComposingSaplingsGenerations < geneticsMap2.sumOfComposingSaplingsGenerations ||
            (geneticsMap1.sumOfComposingSaplingsGenerations === geneticsMap2.sumOfComposingSaplingsGenerations &&
              geneticsMap1.crossbreedSaplings.length < geneticsMap2.crossbreedSaplings.length)))))
  ) {
    return -1;
  } else {
    return 1;
  }
}

/**
 * Used for sorting Map Groups that that each gives different result Sapling.
 */
export function resultMapGroupsSortingFunction(
  geneticsMapsGroup1: GeneticsMapGroup,
  geneticsMapsGroup2: GeneticsMapGroup
): number {
  const group1FirstMap = geneticsMapsGroup1.mapList[0];
  const group2FirstMap = geneticsMapsGroup2.mapList[0];
  if (
    group1FirstMap.score > group2FirstMap.score ||
    (group1FirstMap.score === group2FirstMap.score &&
      (group1FirstMap.chancePercent > group2FirstMap.chancePercent ||
        (group1FirstMap.chancePercent === group2FirstMap.chancePercent &&
          (group1FirstMap.resultSapling.generationIndex < group2FirstMap.resultSapling.generationIndex ||
            (group1FirstMap.resultSapling.generationIndex === group2FirstMap.resultSapling.generationIndex &&
              (group1FirstMap.sumOfComposingSaplingsGenerations < group2FirstMap.sumOfComposingSaplingsGenerations ||
                (group1FirstMap.sumOfComposingSaplingsGenerations ===
                  group2FirstMap.sumOfComposingSaplingsGenerations &&
                  group1FirstMap.getSumOfComposingSaplingsChances() >
                    group2FirstMap.getSumOfComposingSaplingsChances()) ||
                geneticsMapsGroup1.resultSaplingGeneString < geneticsMapsGroup2.resultSaplingGeneString))))))
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

export function getMaxPositionsCount(itemsCount: number, withRepetitions: boolean, maxCrossbreedingSaplings: number) {
  return withRepetitions ? maxCrossbreedingSaplings : Math.min(itemsCount, maxCrossbreedingSaplings);
}

export function getNumberOfCrossbreedingCombinations(
  itemsCount: number,
  withRepetitions: boolean,
  minCrossbreedingSaplings: number,
  maxCrossbreedingSaplings: number
) {
  let numberOfAllCombinations = 0;
  const maxItemsInVariation = getMaxPositionsCount(itemsCount, withRepetitions, maxCrossbreedingSaplings);
  for (let k = minCrossbreedingSaplings; k <= maxItemsInVariation; k++) {
    if (withRepetitions) {
      numberOfAllCombinations += rFact(k + itemsCount - 1) / (rFact(k) * rFact(itemsCount - 1));
    } else {
      numberOfAllCombinations += rFact(itemsCount) / (rFact(k) * rFact(itemsCount - k));
    }
  }
  // Math.round is needed because division can end up being a very close approximation of a Integer due to floating-point system.
  return Math.round(numberOfAllCombinations);
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
  withRepetitions: boolean,
  mandatorySaplingsCount?: number
): { nextPositionIndexForInc: number; hasMoreCombinations: boolean } {
  let hasMoreCombinations = true;
  let keepOriganizingPositions = true;
  while (keepOriganizingPositions) {
    positions[currentPositionIndexForInc] += 1;

    let maxSaplingIndexOnCurrentPosition;
    // If we are get mandatorySaplingsCount it means that it's not the first generation,
    // and that every combination that we consider includes at least one of the saplings added from the results from previous generation.
    // By limiting the possible saplings on first (0) position we fulfill that requirement
    // and also prevent checking combinations which were already handled in the previous generation.
    if (mandatorySaplingsCount && currentPositionIndexForInc === 0) {
      maxSaplingIndexOnCurrentPosition = mandatorySaplingsCount - 1;
    } else {
      // Example:
      // For no repetitions consider 3 possible positions and 8 source saplings.
      // Last position is [5, 6, 7], and following calculation has to be done:
      // - to calculate max on third position: 8 - (3 - 2)
      // - to calculate max on second position: 8 - (3 - 1)
      // - to calculate max on first position: 8 - (3 - 0)
      maxSaplingIndexOnCurrentPosition = withRepetitions
        ? sourceSaplingsCount - 1
        : sourceSaplingsCount - (positionCount - currentPositionIndexForInc);
    }

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
 * @param minCrossbreedingSaplings Option defining how many crossbreeding saplings can be used in the process at minimum.
 * @param maxCrossbreedingSaplings Option defining how many crossbreeding saplings can be used in the process at maximum.
 * @param mandatorySaplingsCount Number of sourceSaplings that need to be present in all considered combinations. This value comes from
 * muli-generation crossbreeding, and reflects the number of saplings taken from previous generation to execute next generation crossbreeding.
 * @returns List of objects which represent chunks of work.
 */
export function getWorkChunks(
  sourceSaplingsCount: number,
  withRepetitions: boolean,
  minCrossbreedingSaplings: number,
  maxCrossbreedingSaplings: number,
  mandatorySaplingsCount?: number
) {
  let allCombinationsCount = getNumberOfCrossbreedingCombinations(
    sourceSaplingsCount,
    withRepetitions,
    minCrossbreedingSaplings,
    maxCrossbreedingSaplings
  );

  if (mandatorySaplingsCount) {
    const combinationsToIgnore = getNumberOfCrossbreedingCombinations(
      sourceSaplingsCount - mandatorySaplingsCount,
      withRepetitions,
      minCrossbreedingSaplings,
      maxCrossbreedingSaplings
    );
    allCombinationsCount -= combinationsToIgnore;
  }

  const numberOfWorkers = Math.ceil(navigator.hardwareConcurrency / 4);
  const combinationsPerWorker = Math.ceil(allCombinationsCount / numberOfWorkers);
  const workChunks = [];

  let workerIndex = 0;
  let combinationsProcessed = 0;
  for (
    let positionCount = minCrossbreedingSaplings;
    positionCount <= getMaxPositionsCount(sourceSaplingsCount, withRepetitions, maxCrossbreedingSaplings);
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
        withRepetitions,
        mandatorySaplingsCount
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

/**
 * Appends partial results to the total list of results.
 * @param mapGroupMap Total results so far.
 * @param mapList Partial results.
 */
export function appendListToMapGroupsMap(
  mapGroupMap: { [key: string]: GeneticsMapGroup },
  mapList: GeneticsMap[]
): void {
  mapList.forEach((geneticsMap) => {
    const resultSaplingGeneString = geneticsMap.resultSapling.toString();
    if (mapGroupMap[resultSaplingGeneString] === undefined) {
      mapGroupMap[resultSaplingGeneString] = new GeneticsMapGroup(resultSaplingGeneString, [geneticsMap]);
    } else {
      mapGroupMap[resultSaplingGeneString].mapList.push(geneticsMap);
    }

    mapGroupMap[resultSaplingGeneString].mapList.sort(resultMapsSortingFunction);
    // Discards results if there is more than 3 maps for the same resultSapling.
    mapGroupMap[resultSaplingGeneString].mapList = mapGroupMap[resultSaplingGeneString].mapList.slice(0, 3);
  });
}

/**
 * Returns best genes to use for next generation on top of genes from previous generation.
 * Choice is based on identifying what is missing in the source genes from previous generation and by filling the gaps.
 * @param sourceSaplings Saplings used for crossbreeding in the current generation.
 * Sum of saplings provided by the user and those used in the current generation.
 * @param allResults Results so far.
 * @param currentGenerationIndex Index of the current generation that was calculated.
 * @param numberOfSaplingsAddedBetweenGenerations How many saplings should be selected by this method for next generation.
 * @param geneScores Score for gene provided from the app options. Used to define the worst column and to score saplings.
 */
export function getBestSaplingsForNextGeneration(
  sourceSaplings: Sapling[],
  allResults: GeneticsMapGroup[],
  currentGenerationIndex: number,
  numberOfSaplingsAddedBetweenGenerations: number,
  geneScores: Record<GeneEnum, number>
): Sapling[] {
  const resultSaplings: Sapling[] = [];

  const mapsToConsider = allResults
    .filter((mapGroup) => mapGroup.mapList[0].resultSapling.generationIndex === currentGenerationIndex)
    .map((mapGroup) => mapGroup.mapList[0]);

  const resultGeneScoresPerColumn = new Array(6).fill(0);
  const addSaplingScoresToResultGeneScoresPerColumn = (sapling: Sapling) => {
    for (let colIndex = 0; colIndex < resultGeneScoresPerColumn.length; colIndex++) {
      resultGeneScoresPerColumn[colIndex] += geneScores[sapling.genes[colIndex].type];
    }
  };
  sourceSaplings.forEach(addSaplingScoresToResultGeneScoresPerColumn);

  for (
    let saplingsToAdd = Math.min(numberOfSaplingsAddedBetweenGenerations, mapsToConsider.length);
    saplingsToAdd > 0;
    saplingsToAdd--
  ) {
    // Has information about order of columns by their score ordered from worst to best.
    const resultGeneScoresPerColumnIndexedWorstToBest = resultGeneScoresPerColumn
      .map((score, index) => ({
        score,
        index
      }))
      .sort((a, b) => a.score - b.score);

    // Go through all resultMaps and reduce the choice to the best ones
    // according to how well they compensate current sourceSaplings.
    let currentSubsetOfMapsToConsider = [...mapsToConsider];
    resultGeneScoresPerColumnIndexedWorstToBest.forEach((colInfo) => {
      const bestScoreInCurrentCol = Math.max(
        ...currentSubsetOfMapsToConsider.map((map) => geneScores[map.resultSapling.genes[colInfo.index].type])
      );
      currentSubsetOfMapsToConsider = currentSubsetOfMapsToConsider.filter(
        (map) => geneScores[map.resultSapling.genes[colInfo.index].type] === bestScoreInCurrentCol
      );
    });
    currentSubsetOfMapsToConsider.sort(resultMapsSortingFunction);

    const bestMapToAdd = currentSubsetOfMapsToConsider[0];
    resultSaplings.push(bestMapToAdd.resultSapling);

    // Include chosen sapling's score in the tracked column score, to better decide on next additions.
    addSaplingScoresToResultGeneScoresPerColumn(bestMapToAdd.resultSapling);

    // Remove the sapling from the list as we no longer consider it.
    const indexOfAddedSaplingInCosideredList = mapsToConsider.indexOf(bestMapToAdd);
    mapsToConsider.splice(indexOfAddedSaplingInCosideredList, 1);
  }

  return resultSaplings;
}

/**
 * Fixes Prototype assignments after worker serialization to make sure that all the Class methods are accessible.
 * @param mapList List of results, that require prototype fixes.
 */
export function fixPrototypeAssignmentsAfterSerialization(mapList: GeneticsMap[]) {
  mapList.forEach((map) => {
    Object.setPrototypeOf(map, GeneticsMap.prototype);
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

/**
 * Fixes Prototype assignments after worker serialization to make sure that all the Class methods are accessible.
 * @param rawSapling Fixed Sapling object.
 */
export function fixSaplingPrototypeAssignments(rawSapling: Sapling): Sapling {
  Object.setPrototypeOf(rawSapling, Sapling.prototype);
  rawSapling.genes.forEach((gene) => {
    Object.setPrototypeOf(gene, Gene.prototype);
  });
  return rawSapling;
}

/**
 * Method links Saplings required to crossbreed with their crossbreeding variants for younger generations.
 * @param mapGroupMap Total results so far.
 */
export function linkGenerationTree(mapGroupMap: { [key: string]: GeneticsMapGroup }) {
  Object.values(mapGroupMap).forEach((mapGroup) => {
    mapGroup.mapList.forEach((map) => {
      if (map.baseSapling) {
        map.baseSaplingVariants = mapGroupMap[map.baseSapling.toString()];
      }
      map.crossbreedSaplingsVariants = new Array(map.crossbreedSaplings.length);
      map.crossbreedSaplings.forEach((crossbreedSapling, crossbreedSaplingIndex) => {
        if (crossbreedSapling.generationIndex > 0) {
          const mapGroup = mapGroupMap[crossbreedSapling.toString()];
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          map.crossbreedSaplingsVariants![crossbreedSaplingIndex] = mapGroup;
          map.crossbreedSaplings[crossbreedSaplingIndex] = mapGroup.mapList[0].resultSapling;
        }
      });
    });
  });
}
