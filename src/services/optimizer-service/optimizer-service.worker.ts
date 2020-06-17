const ctx: Worker = self as any;
import geneticsSimulatorService from './genetics-simulator.service';

ctx.addEventListener('message', (event) => {
  const mapList = geneticsSimulatorService.simulateCrossbreeding(event.data.sourceGenes, {
    callProgressCallbackAfterCombinations: 10000,
    progressCallback: (progressPercent) => {
      ctx.postMessage({ progressPercent });
    },
    ...event.data.options
  });
  ctx.postMessage({ mapList });
});

export default null as any;
