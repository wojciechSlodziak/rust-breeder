import Worker from 'worker-loader!./optimizer-service.worker';
import GeneticsMap from '../../models/genetics-map.model';
import ApplicationOptions from '@/interfaces/application-options';
import { getWorkChunks, sortResults, getNumberOfCrossbreedCombinations } from './optimizer.helper';

export interface EventListenerCallback {
  (eventType: 'PROGRESS_UPDATE' | 'DONE', data: EventListenerCallbackData): void;
}

export interface EventListenerCallbackData {
  isDone?: boolean;
  progressPercent?: number;
  mapList?: GeneticsMap[];
}

class OptimizerService {
  listeners: EventListenerCallback[] = [];

  workerProgress: number[] = [];
  resultMapLists: GeneticsMap[][] = [];

  simulateBestGenetics(sourceGenesString: string, options: ApplicationOptions) {
    this.workerProgress = [];
    this.resultMapLists = [];

    const allSourceSaplingsGenes: string[] = sourceGenesString.split(/\r?\n/);
    const allCombinationsCount = getNumberOfCrossbreedCombinations(allSourceSaplingsGenes.length);

    const deduplicatedSourceSaplingsGenes: string[] = allSourceSaplingsGenes.filter(
      (genes, index, self) => index === self.findIndex((otherGenes) => otherGenes === genes)
    );

    const workChunks = getWorkChunks(deduplicatedSourceSaplingsGenes.length);
    workChunks.forEach((workChunk, workerIndex) => {
      const worker = new Worker();

      worker.postMessage({
        sourceGenes: deduplicatedSourceSaplingsGenes,
        ...workChunk,
        options
      });
      worker.addEventListener('message', (event) => {
        if (event.data.mapList) {
          this.resultMapLists.push(event.data.mapList);

          if (this.resultMapLists.length === workChunks.length) {
            this.listeners.forEach((listener) => {
              listener('DONE', { isDone: true, mapList: this.resultMapLists.flat().sort(sortResults) });
              this.resultMapLists = [];
              this.workerProgress = [];
            });
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
