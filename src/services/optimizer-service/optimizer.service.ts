import Worker from 'worker-loader!./optimizer-service.worker';

interface EventListenerCallback {
  (eventType: 'PROGRESS_UPDATE' | 'DONE', data: any): void;
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
      if (event.data.map) {
        this.listeners.forEach((listener) => {
          listener('DONE', event.data.map);
        });
      } else if (event.data.progressPercent) {
        this.listeners.forEach((listener) => {
          listener('PROGRESS_UPDATE', event.data.progressPercent);
        });
      }
    });
  }

  addEventListener(callback: EventListenerCallback) {
    this.listeners.push(callback);
  }
}

export default new OptimizerService();
