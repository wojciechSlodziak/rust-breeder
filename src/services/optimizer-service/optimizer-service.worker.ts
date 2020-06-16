const ctx: Worker = self as any;
import geneticsSimulatorService from './genetics-simulator.service';

ctx.addEventListener('message', (event) => {
  event.data.sourceGenes;

  const mapList = geneticsSimulatorService.simulateCrossbreeding(event.data.sourceGenes, {
    callProgressCallbackAfterCombinations: 10000,
    progressCallback: (progressPercent) => {
      ctx.postMessage({ progressPercent });
    }
  });
  ctx.postMessage({ mapList });
});
