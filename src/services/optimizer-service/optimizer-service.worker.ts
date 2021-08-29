// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctx: Worker = self as any;
import geneticsSimulatorService from './genetics-simulator.service';

ctx.addEventListener('message', (event) => {
  geneticsSimulatorService.simulateCrossbreeding(
    event.data.sourceGenes,
    event.data.startingPositions,
    event.data.combinationsToProcess,
    {
      callProgressCallbackAfterCombinations: 10000,
      progressCallback: (combinationsProcessed, partialResultMapList) => {
        ctx.postMessage({ combinationsProcessed, partialResultMapList });
      },
      ...event.data.options
    }
  );
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default null as any;
