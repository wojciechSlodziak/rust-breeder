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
  processedChunks = 0;

  simulateBestGenetics(sourceGenes: string[], options: ApplicationOptions) {
    this.workerProgress = [];
    this.resultMapLists = [];
    this.mapGroupMap = {};
    this.processedChunks = 0;

    if (sourceGenes.length < MIN_CROSSBREEDING_SAPLINGS) {
      throw new NotEnoughSourceSaplingsError();
    }

    const workChunks = getWorkChunks(sourceGenes.length);
    workChunks.forEach((workChunk, workerIndex) => {
      const worker = new Worker();

      worker.postMessage({
        sourceGenes: sourceGenes,
        ...workChunk,
        options
      });
      worker.addEventListener('message', (event) => {
        if (event.data.mapList) {
          this.processedChunks += 1;
          appendListToMapGroupsMap(this.mapGroupMap, event.data.mapList);

          if (this.processedChunks === workChunks.length) {
            let mapGroups = Object.values(this.mapGroupMap).sort(resultMapGroupsSortingFunction);
            mapGroups = mapGroups.map((mapGroup, index) => ({ ...mapGroup, index }));

            this.listeners.forEach((listener) => {
              listener('DONE', { isDone: true, mapGroups: mapGroups });
            });
            this.resultMapLists = [];
            this.workerProgress = [];
            this.mapGroupMap = {};
          }
        } else if (event.data.combinationsProcessed) {
          this.listeners.forEach((listener) => {
            this.workerProgress[workerIndex] = event.data.combinationsProcessed;

            listener('PROGRESS_UPDATE', {
              isDone: false,
              progressPercent:
                Number(
                  (
                    this.workerProgress.reduce((acc, current) => acc + current, 0) / workChunk.allCombinationsCount
                  ).toFixed(2)
                ) * 100
            });
          });
        }
      });
    });
  }

  addEventListener(callback: EventListenerCallback) {
    this.listeners.push(callback);
  }
}

export default new OptimizerService();
