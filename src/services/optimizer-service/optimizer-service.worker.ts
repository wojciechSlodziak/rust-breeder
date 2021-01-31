// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctx: Worker = self as any;
import geneticsSimulatorService from './genetics-simulator.service';

ctx.addEventListener('message', (event) => {
  const mapList = geneticsSimulatorService.simulateCrossbreeding(
    event.data.sourceGenes,
    event.data.startingPositions,
    event.data.combinationsToProcess,
    {
      callProgressCallbackAfterCombinations: 2000,
      progressCallback: (combinationsProcessed) => {
        ctx.postMessage({ combinationsProcessed });
      },
      ...event.data.options
    }
  );
  ctx.postMessage({ mapList });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default null as any;
