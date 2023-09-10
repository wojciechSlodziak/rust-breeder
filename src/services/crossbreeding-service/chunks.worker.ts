// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctx: Worker = self as any;

import { getWorkChunks } from './helper';

ctx.addEventListener('message', (event) => {
  const { numberOfWorkChunks, sourceSaplings, options, generationInfo } = event.data;
  const workChunks = getWorkChunks(
    numberOfWorkChunks,
    sourceSaplings.length,
    options.withRepetitions,
    options.minCrossbreedingSaplingsNumber,
    options.maxCrossbreedingSaplingsNumber,
    generationInfo.addedSaplings
  );
  ctx.postMessage({ workChunks });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default null as any;
