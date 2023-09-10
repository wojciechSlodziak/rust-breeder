// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctx: Worker = self as any;

import Sapling from '@/models/sapling.model';
import geneticsSimulatorService from './crossbreeding.service';
import { fixSaplingPrototypeAssignments, createMapGroupMap } from './helper';
import {
  CALL_PROGRESS_CALLBACK_AFTER_COMBINATIONS,
  CALL_PROGRESS_CALLBACK_AFTER_NUMBER_OF_RESULTS_REACHED
} from './config';
import { WorkChunk } from './models';

ctx.addEventListener('message', (event) => {
  const workChunks = event.data.workChunks;

  workChunks.forEach((workChunk: WorkChunk) => {
    geneticsSimulatorService.simulateCrossbreeding(
      event.data.sourceSaplings.map((rawSapling: Sapling) => fixSaplingPrototypeAssignments(rawSapling)),
      workChunk.startingPositions,
      workChunk.combinationsToProcess,
      event.data.generationInfo,
      {
        callProgressCallbackAfterCombinations: CALL_PROGRESS_CALLBACK_AFTER_COMBINATIONS,
        callProgressCallbackAfterNumberOfResultsReached: CALL_PROGRESS_CALLBACK_AFTER_NUMBER_OF_RESULTS_REACHED,
        progressCallback: (combinationsProcessed, partialResultMapList) => {
          ctx.postMessage({
            combinationsProcessed,
            partialMapGroupMap: createMapGroupMap(partialResultMapList)
          });
        },
        ...event.data.options
      }
    );
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default null as any;
