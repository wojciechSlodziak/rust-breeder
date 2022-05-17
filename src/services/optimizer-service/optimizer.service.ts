import Worker from 'worker-loader!./optimizer-service.worker';
import GeneticsMap from '../../models/genetics-map.model';
import ApplicationOptions from '@/interfaces/application-options';
import {
  getWorkChunks,
  resultMapGroupsSortingFunction,
  appendListToMapGroupsMap,
  fixPrototypeAssignmentsAfterSerialization
} from './optimizer.helper';
import { MIN_CROSSBREEDING_SAPLINGS } from '@/const';
import { OptimizerServiceEventListenerCallback, MapGroup, NotEnoughSourceSaplingsError } from './models';

class OptimizerService {
  listeners: OptimizerServiceEventListenerCallback[] = [];

  workers: Worker[];
  workerProgress: number[] = [];
  resultMapLists: GeneticsMap[][] = [];
  mapGroupMap: { [key: string]: MapGroup } = {};

  /**
   * Entry point in the application where dispatching work and maintaining progress updates happenn.
   * @param sourceGenes List of raw String representations of saplings provided by the User.
   * @param options Options provided from the UI, selected by the User.
   */
  simulateBestGenetics(sourceGenes: string[], options: ApplicationOptions) {
    this.workerProgress = [];
    this.resultMapLists = [];
    this.mapGroupMap = {};

    if (sourceGenes.length < MIN_CROSSBREEDING_SAPLINGS) {
      throw new NotEnoughSourceSaplingsError();
    }

    this.workers = [];

    const workChunks = getWorkChunks(sourceGenes.length, options.withRepetitions, options.maxCrossbreedingSaplings);
    workChunks.forEach((workChunk, workerIndex) => {
      const worker = new Worker();
      this.workers.push(worker);

      worker.postMessage({
        sourceGenes: sourceGenes,
        ...workChunk,
        options
      });

      worker.addEventListener('message', (event) => {
        fixPrototypeAssignmentsAfterSerialization(event.data.partialResultMapList);

        // Handling partial results.
        appendListToMapGroupsMap(this.mapGroupMap, event.data.partialResultMapList);
        let mapGroups = Object.values(this.mapGroupMap).sort(resultMapGroupsSortingFunction);
        mapGroups = mapGroups.map((mapGroup, index) => ({ ...mapGroup, index }));

        // Progress tracking.
        this.workerProgress[workerIndex] = event.data.combinationsProcessed;

        // Progress updates notfication.
        this.listeners.forEach((listenerCallback) => {
          listenerCallback('PROGRESS_UPDATE', {
            isDone: false,
            mapGroups,
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

        // Handling complete results.
        if (
          this.workerProgress.reduce((acc, singleWorkerProgress) => acc + singleWorkerProgress, 0) ===
          workChunk.allCombinationsCount
        ) {
          this.listeners.forEach((listenerCallback) => {
            listenerCallback('DONE', { isDone: true, mapGroups });
          });

          // Cleanup.
          this.resultMapLists = [];
          this.workerProgress = [];
          this.mapGroupMap = {};
        }
      });
    });
  }

  cancelSimulation() {
    this.workers.forEach((worker) => {
      worker.terminate();
    });
  }

  addEventListener(callback: OptimizerServiceEventListenerCallback) {
    this.listeners.push(callback);
  }
}

export default new OptimizerService();
