const ctx: Worker = self as any;
import geneticsSimulatorService from './genetics-simulator.service';

ctx.addEventListener('message', (event) => {
  event.data.sourceGenes;

  const map = geneticsSimulatorService.simulateCrossbreeding(event.data.sourceGenes, {
    callProgressCallbackAfterCombinations: 1000,
    progressCallback: (progressPercent) => {
      ctx.postMessage({ progressPercent });
    }
  });
  ctx.postMessage({ map });
});
