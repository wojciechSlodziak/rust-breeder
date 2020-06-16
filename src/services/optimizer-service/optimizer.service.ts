import Worker from 'worker-loader!./optimizer-service.worker';
import GeneticsMap from './models/genetics-map.model';

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

  simulateBestGenetics(sourceGenesString: string) {
    const allSourceSaplingsGenes: string[] = sourceGenesString.split(/\r?\n/);

    const deduplicatedSourceSaplingsGenes: string[] = allSourceSaplingsGenes.filter(
      (genes, index, self) => index === self.findIndex((otherGenes) => otherGenes === genes)
    );

    const worker = new Worker();

    worker.postMessage({ sourceGenes: deduplicatedSourceSaplingsGenes });
    worker.addEventListener('message', (event) => {
      if (event.data.mapList) {
        this.listeners.forEach((listener) => {
          listener('DONE', { isDone: true, mapList: event.data.mapList });
        });
      } else if (event.data.progressPercent) {
        this.listeners.forEach((listener) => {
          listener('PROGRESS_UPDATE', { isDone: false, progressPercent: event.data.progressPercent });
        });
      }
    });
  }

  addEventListener(callback: EventListenerCallback) {
    this.listeners.push(callback);
  }
}

export default new OptimizerService();
