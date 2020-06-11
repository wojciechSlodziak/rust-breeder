import Worker from 'worker-loader!./optimizer-service.worker';

class OptimizerService {
  simulateBestGenetics(sourceGenesString: string) {
    const allSourceSaplingsGenes: string[] = sourceGenesString.split(/\r?\n/);

    const deduplicatedSourceSaplingsGenes: string[] = allSourceSaplingsGenes.filter(
      (genes, index, self) => index === self.findIndex((otherGenes) => otherGenes === genes)
    );

    const worker = new Worker();

    worker.postMessage({ sourceGenes: deduplicatedSourceSaplingsGenes });
    worker.addEventListener('message', function(event) {
      if (event.data.map) {
        console.log('done!', event.data.map);
      } else if (event.data.progressPercent) {
        console.log('progress!', event.data.progressPercent);
      }
    });
  }
}

export default new OptimizerService();
