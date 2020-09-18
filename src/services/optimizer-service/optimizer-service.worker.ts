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

export default null as any;
