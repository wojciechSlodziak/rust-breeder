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

      worker.addEventListener('message', (e) => {
        this.handleWorkerMessage(e, worker, workerIndex, sourceSaplings, generationInfo.index, workChunk, options);
      });
    });
  }

  handleWorkerMessage(
    event: MessageEvent,
    workerRef: Worker,
    workerIndex: number,
    sourceSaplings: Sapling[],
    generationIndex: number,
    workChunk: {
      startingPositions: number[];
      combinationsToProcess: number;
      allCombinationsCount: number;
    },
    options: ApplicationOptions
  ) {
    fixPrototypeAssignmentsAfterSerialization(event.data.partialResultMapList);

    // Handling partial results.
    appendListToMapGroupsMap(this.mapGroupMap, event.data.partialResultMapList);
    linkGenerationTree(this.mapGroupMap);

    // Progress tracking.
    this.workerProgress[workerIndex] = event.data.combinationsProcessed;

    // Progress updates notfication.
    const progressPercent =
      Number(
        (this.workerProgress.reduce((acc, current) => acc + current, 0) / workChunk.allCombinationsCount).toFixed(2)
      ) * 100;
    this.sendEvent('PROGRESS_UPDATE', {
      generationIndex: generationIndex,
      progressPercent
    });

    // Worker has to be terminated when it has finished all the work.
    if (this.workerProgress[workerIndex] === workChunk.combinationsToProcess) {
      workerRef.terminate();
    }

    // Handling complete results.
    if (
      this.workerProgress.reduce((acc, singleWorkerProgress) => acc + singleWorkerProgress, 0) ===
      workChunk.allCombinationsCount
    ) {
      const mapGroups = Object.values(this.mapGroupMap).sort(resultMapGroupsSortingFunction);
      this.sendEvent('DONE_GENERATION', { generationIndex: generationIndex, mapGroups });

      if (generationIndex < options.numberOfGenerations) {
        const additionalSourceSaplings = getBestSaplingsForNextGeneration(
          sourceSaplings,
          mapGroups,
          generationIndex,
          options.numberOfSaplingsAddedBetweenGenerations,
          options.geneScores
        );
        if (additionalSourceSaplings.length > 0) {
          const newGenerationInfo: GenerationInfo = {
            index: generationIndex + 1,
            addedSaplings: additionalSourceSaplings.length
          };
          const nextGenerationSourceGenes = [...additionalSourceSaplings, ...sourceSaplings];
          this.simulateBestGenetics(nextGenerationSourceGenes, newGenerationInfo, options);
        } else {
          this.sendEvent('DONE', { mapGroups, generationIndex: generationIndex });
        }
      } else {
        this.sendEvent('DONE', { mapGroups, generationIndex: generationIndex });
        // Final Cleanup.
        this.workerProgress = [];
        this.mapGroupMap = {};
      }
    }
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
