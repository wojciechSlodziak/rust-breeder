import Worker from 'worker-loader!./optimizer-service.worker';
import GeneticsMap from '../../models/genetics-map.model';
import ApplicationOptions from '@/interfaces/application-options';
import {
  getWorkChunks,
  resultMapsSortingFunction,
  getNumberOfCrossbreedCombinations,
  getGroupedResults,
  EventListenerCallback,
  NotEnoughSourceSaplingsError
} from './optimizer.helper';

class OptimizerService {
  listeners: EventListenerCallback[] = [];

  workerProgress: number[] = [];
  resultMapLists: GeneticsMap[][] = [];

  simulateBestGenetics(sourceGenes: string[], options: ApplicationOptions) {
    this.workerProgress = [];
    this.resultMapLists = [];

    if (sourceGenes.length < 2) {
      throw new NotEnoughSourceSaplingsError();
    }

    const allCombinationsCount = getNumberOfCrossbreedCombinations(sourceGenes.length);

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
          this.resultMapLists.push(event.data.mapList);

          if (this.resultMapLists.length === workChunks.length) {
            const mapList = this.resultMapLists.flat().sort(resultMapsSortingFunction);

            this.listeners.forEach((listener) => {
              listener('DONE', { isDone: true, mapGroups: getGroupedResults(mapList) });
            });
            this.resultMapLists = [];
            this.workerProgress = [];
          }
        } else if (event.data.combinationsProcessed) {
          this.listeners.forEach((listener) => {
            this.workerProgress[workerIndex] = event.data.combinationsProcessed;

            listener('PROGRESS_UPDATE', {
              isDone: false,
              progressPercent:
                Number(
                  (this.workerProgress.reduce((acc, current) => acc + current, 0) / allCombinationsCount).toFixed(2)
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
