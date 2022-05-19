import Worker from 'worker-loader!./optimizer-service.worker';
import ApplicationOptions from '@/interfaces/application-options';
import {
  getWorkChunks,
  resultMapGroupsSortingFunction,
  appendListToMapGroupsMap,
  fixPrototypeAssignmentsAfterSerialization,
  getBestSaplingsForNextGeneration,
  linkGenerationTree
} from './optimizer.helper';
import {
  OptimizerServiceEventListenerCallback,
  NotEnoughSourceSaplingsError,
  OptimizerServiceEventListenerCallbackData,
  GenerationInfo,
  GeneticsMapGroup
} from './models';
import Sapling from '@/models/sapling.model';

class OptimizerService {
  listeners: OptimizerServiceEventListenerCallback[] = [];

  workers: Worker[];
  workerProgress: number[] = [];
  mapGroupMap: { [key: string]: GeneticsMapGroup } = {};

  /**
   * Entry point in the application where dispatching work and maintaining progress updates happenn.
   * @param sourceGenes List of raw String representations of saplings provided by the User.
   * @param options Options provided from the UI, selected by the User.
   */
  simulateBestGenetics(
    sourceSaplings: Sapling[],
    generationInfo: GenerationInfo = { index: 1 },
    options: ApplicationOptions
  ) {
    this.workerProgress = [];
    if (generationInfo.index === 1) {
      this.mapGroupMap = {};
    }

    if (sourceSaplings.length < options.minCrossbreedingSaplingsNumber) {
      throw new NotEnoughSourceSaplingsError();
    }

    this.workers = [];

    const workChunks = getWorkChunks(
      sourceSaplings.length,
      options.withRepetitions,
      options.minCrossbreedingSaplingsNumber,
      options.maxCrossbreedingSaplingsNumber,
      generationInfo.addedSaplings
    );

    workChunks.forEach((workChunk, workerIndex) => {
      const worker = new Worker();
      this.workers.push(worker);

      worker.postMessage({
        sourceSaplings: sourceSaplings,
        ...workChunk,
        generationInfo,
        options
      });

      worker.addEventListener('message', (event) => {
        fixPrototypeAssignmentsAfterSerialization(event.data.partialResultMapList);

        // Handling partial results.
        appendListToMapGroupsMap(this.mapGroupMap, event.data.partialResultMapList);
        linkGenerationTree(this.mapGroupMap);
        const mapGroups = Object.values(this.mapGroupMap).sort(resultMapGroupsSortingFunction);

        // Progress tracking.
        this.workerProgress[workerIndex] = event.data.combinationsProcessed;

        // Progress updates notfication.
        const progressPercent =
          Number(
            (this.workerProgress.reduce((acc, current) => acc + current, 0) / workChunk.allCombinationsCount).toFixed(2)
          ) * 100;
        this.sendEvent('PROGRESS_UPDATE', {
          generationIndex: generationInfo.index,
          mapGroups,
          progressPercent
        });

        // Worker has to be terminated when it has finished all the work.
        if (this.workerProgress[workerIndex] === workChunk.combinationsToProcess) {
          worker.terminate();
        }

        // Handling complete results.
        if (
          this.workerProgress.reduce((acc, singleWorkerProgress) => acc + singleWorkerProgress, 0) ===
          workChunk.allCombinationsCount
        ) {
          this.sendEvent('DONE_GENERATION', { generationIndex: generationInfo.index, mapGroups });

          if (generationInfo.index < options.numberOfGenerations) {
            console.log('starting next generation');
            const additionalSourceSaplings = getBestSaplingsForNextGeneration(
              sourceSaplings,
              mapGroups,
              generationInfo.index,
              options.numberOfSaplingsAddedBetweenGenerations
            );
            if (additionalSourceSaplings.length > 0) {
              const newGenerationInfo: GenerationInfo = {
                index: generationInfo.index + 1,
                addedSaplings: additionalSourceSaplings.length
              };
              console.log('adding to next generation -> ', additionalSourceSaplings);
              const nextGenerationSourceGenes = [...additionalSourceSaplings, ...sourceSaplings];
              console.log('nextGenerationSourceGenes', nextGenerationSourceGenes);
              this.simulateBestGenetics(nextGenerationSourceGenes, newGenerationInfo, options);
            } else {
              this.sendEvent('DONE', { mapGroups, generationIndex: generationInfo.index });
            }
          } else {
            this.sendEvent('DONE', { mapGroups, generationIndex: generationInfo.index });
            // Final Cleanup.
            this.workerProgress = [];
            this.mapGroupMap = {};
          }
        }
      });
    });
  }

  sendEvent(
    eventType: 'PROGRESS_UPDATE' | 'DONE_GENERATION' | 'DONE',
    data: OptimizerServiceEventListenerCallbackData
  ) {
    this.listeners.forEach((listenerCallback) => {
      listenerCallback(eventType, data);
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
