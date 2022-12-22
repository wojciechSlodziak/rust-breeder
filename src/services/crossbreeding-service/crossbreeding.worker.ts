// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctx: Worker = self as any;

import Sapling from '@/models/sapling.model';
import geneticsSimulatorService from './crossbreeding.service';
import { fixSaplingPrototypeAssignments, createMapGroupMap } from './helper';

ctx.addEventListener('message', (event) => {
  geneticsSimulatorService.simulateCrossbreeding(
    event.data.sourceSaplings.map((rawSapling: Sapling) => fixSaplingPrototypeAssignments(rawSapling)),
    event.data.startingPositions,
    event.data.combinationsToProcess,
    event.data.generationInfo,
    {
      callProgressCallbackAfterCombinations: 10000,
      callProgressCallbackAfterNumberOfResultsReached: 5000,
      progressCallback: (combinationsProcessed, partialResultMapList) => {
        ctx.postMessage({ combinationsProcessed, partialMapGroupMap: createMapGroupMap(partialResultMapList) });
      },
      ...event.data.options
    }
  );
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default null as any;
