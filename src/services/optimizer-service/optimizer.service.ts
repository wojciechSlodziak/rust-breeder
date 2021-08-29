import Worker from 'worker-loader!./optimizer-service.worker';
import GeneticsMap from '../../models/genetics-map.model';
import ApplicationOptions from '@/interfaces/application-options';
import { getWorkChunks, resultMapGroupsSortingFunction, appendListToMapGroupsMap } from './optimizer.helper';
import { MIN_CROSSBREEDING_SAPLINGS } from '@/const';
import { EventListenerCallback, MapGroup, NotEnoughSourceSaplingsError } from './models';

class OptimizerService {
  listeners: EventListenerCallback[] = [];

  workerProgress: number[] = [];
  resultMapLists: GeneticsMap[][] = [];
  mapGroupMap: { [key: string]: MapGroup } = {};

  simulateBestGenetics(sourceGenes: string[], options: ApplicationOptions) {
    this.workerProgress = [];
    this.resultMapLists = [];
    this.mapGroupMap = {};

    if (sourceGenes.length < MIN_CROSSBREEDING_SAPLINGS) {
      throw new NotEnoughSourceSaplingsError();
    }

    const workers: Worker[] = [];

    const workChunks = getWorkChunks(sourceGenes.length, options.withRepetitions);
    workChunks.forEach((workChunk, workerIndex) => {
      const worker = new Worker();
      workers.push(worker);

      worker.postMessage({
        sourceGenes: sourceGenes,
        ...workChunk,
        options
      });

      worker.addEventListener('message', (event) => {
        // handling partial results
        appendListToMapGroupsMap(this.mapGroupMap, event.data.partialResultMapList);

        // progress tracking
        this.workerProgress[workerIndex] = event.data.combinationsProcessed;

        // progress updates notfication
        this.listeners.forEach((listenerCallback) => {
          listenerCallback('PROGRESS_UPDATE', {
            isDone: false,
            progressPercent:
              Number(
                (
                  this.workerProgress.reduce((acc, current) => acc + current, 0) / workChunk.allCombinationsCount
                ).toFixed(2)
              ) * 100
          });
        });

        if (this.workerProgress[workerIndex] === workChunk.combinationsToProcess) {
          worker.terminate();
        }

        // handling complete results
        if (
          this.workerProgress.reduce((acc, singleWorkerProgress) => acc + singleWorkerProgress, 0) ===
          workChunk.allCombinationsCount
        ) {
          // process final results
          let mapGroups = Object.values(this.mapGroupMap).sort(resultMapGroupsSortingFunction);
          mapGroups = mapGroups.map((mapGroup, index) => ({ ...mapGroup, index }));
          console.log('total', mapGroups.length);

          this.listeners.forEach((listenerCallback) => {
            listenerCallback('DONE', { isDone: true, mapGroups: mapGroups });
          });

          // cleanup
          this.resultMapLists = [];
          this.workerProgress = [];
          this.mapGroupMap = {};
        }
      });
    });
  }

  addEventListener(callback: EventListenerCallback) {
    this.listeners.push(callback);
  }
}

export default new OptimizerService();
