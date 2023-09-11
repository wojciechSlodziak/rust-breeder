import ChunksWorker from 'worker-loader!./chunks.worker';
import CrossbreedingWorker from 'worker-loader!./crossbreeding.worker';
import ApplicationOptions from '@/interfaces/application-options';
import {
  resultMapGroupsSortingFunction,
  joinMapGroupMaps,
  fixPrototypeAssignmentsAfterSerialization,
  getBestSaplingsForNextGeneration,
  linkGenerationTree
} from './helper';
import {
  CrossbreedingOrchestratorEventListenerCallback,
  CrossbreedingOrchestratorEventListenerCallbackData,
  GenerationInfo,
  GeneticsMapGroup,
  ProcessingStat,
  WorkChunk
} from './models';
import Sapling from '@/models/sapling.model';
import { WORK_CHUNKS_PER_WORKER } from './config';

const ESTIMATION_TIME_UNIT = 10000;
const ESTIMATION_SENT_AFTER = ESTIMATION_TIME_UNIT / 10;

class CrossbreedingOrchestrator {
  listeners: CrossbreedingOrchestratorEventListenerCallback[] = [];

  chunksWorker: ChunksWorker;
  workers: CrossbreedingWorker[];
  combinationsToProcess: number;
  combinationsProcessedSoFar: number;
  mapGroupMap: { [key: string]: GeneticsMapGroup } = {};

  processingStats: ProcessingStat[];
  startTimestamp: number;

  /**
   * Entry point in the application where dispatching work and maintaining progress updates happen.
   * @param sourceGenes List of raw String representations of saplings provided by the User.
   * @param options Options provided from the UI, selected by the User.
   */
  simulateBestGenetics(
    sourceSaplings: Sapling[],
    generationInfo: GenerationInfo = { index: 1 },
    options: ApplicationOptions
  ) {
    const { numberOfWorkers } = options;

    this.startTimestamp = new Date().getTime();

    if (generationInfo.index === 1) {
      this.mapGroupMap = {};
    }

    this.workers = [];
    this.processingStats = [];

    this.chunksWorker = new ChunksWorker();

    // If there is just one worker there is no reason to split its work so we aim for just 1 chunk.
    // Otherwise we scale number of chunks with number of workers.
    const numberOfWorkChunks = numberOfWorkers > 1 ? numberOfWorkers * WORK_CHUNKS_PER_WORKER : 1;
    this.chunksWorker.postMessage({
      numberOfWorkChunks,
      sourceSaplings,
      options,
      generationInfo
    });

    this.chunksWorker.addEventListener('message', (event) => {
      this.chunksWorker.terminate();
      const { workChunks } = event.data as { workChunks: WorkChunk[] };
      this.combinationsToProcess = workChunks[0].allCombinationsCount;
      this.combinationsProcessedSoFar = 0;

      const workChunksPerWorker: WorkChunk[][] = [];
      for (let workerIndex = 0; workerIndex < numberOfWorkers; workerIndex++) {
        const currentWorkerWorkChunks = workChunks.filter(
          (workChunk, workChunkIndex) => workChunkIndex % numberOfWorkers === workerIndex
        );
        workChunksPerWorker.push(currentWorkerWorkChunks);
      }

      for (let workerIndex = 0; workerIndex < numberOfWorkers; workerIndex++) {
        const worker = new CrossbreedingWorker();
        this.workers.push(worker);

        worker.addEventListener('message', (event) => {
          this.handleWorkerMessage(event, sourceSaplings, generationInfo.index, options);
        });

        worker.postMessage({
          sourceSaplings,
          workChunks: workChunksPerWorker[workerIndex],
          generationInfo,
          options
        });
      }
    });
  }

  handleWorkerMessage(
    event: MessageEvent,
    sourceSaplings: Sapling[],
    generationIndex: number,
    options: ApplicationOptions
  ) {
    // Handling partial results.
    joinMapGroupMaps(this.mapGroupMap, event.data.partialMapGroupMap);

    // Progress tracking.
    const currentCombinationsProcessedSoFar = this.combinationsProcessedSoFar + event.data.combinationsProcessed;
    const combinationsProcessedBetweenUpdates = currentCombinationsProcessedSoFar - this.combinationsProcessedSoFar;
    this.combinationsProcessedSoFar = currentCombinationsProcessedSoFar;

    // Time estimation.
    const currentTimestamp = new Date().getTime();
    this.processingStats.push({
      timestamp: currentTimestamp,
      combinationsProcessed: combinationsProcessedBetweenUpdates
    });
    this.processingStats = this.processingStats.filter(
      (stat) => stat.timestamp > currentTimestamp - ESTIMATION_TIME_UNIT
    );
    let avgTimeMsLeft = null;
    if (currentTimestamp - this.startTimestamp >= ESTIMATION_SENT_AFTER) {
      const avgCombinationsPerMs =
        this.processingStats.reduce((acc, val) => acc + val.combinationsProcessed, 0) /
        Math.min(ESTIMATION_TIME_UNIT, currentTimestamp - this.startTimestamp);
      avgTimeMsLeft = (this.combinationsToProcess - this.combinationsProcessedSoFar) / avgCombinationsPerMs;
    }

    // Progress updates notfication.
    const progressPercent = Number(((this.combinationsProcessedSoFar / this.combinationsToProcess) * 100).toFixed(2));
    this.sendEvent('PROGRESS_UPDATE', {
      generationIndex: generationIndex,
      estimatedTimeMs: avgTimeMsLeft,
      progressPercent
    });

    // Handling complete generation results.
    if (this.combinationsProcessedSoFar === this.combinationsToProcess) {
      this.terminateAllWorkers();
      fixPrototypeAssignmentsAfterSerialization(this.mapGroupMap);
      linkGenerationTree(this.mapGroupMap);
      const mapGroups = Object.values(this.mapGroupMap).sort(resultMapGroupsSortingFunction);
      this.sendEvent('DONE_GENERATION', {
        generationIndex: generationIndex,
        estimatedTimeMs: avgTimeMsLeft,
        mapGroups
      });

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
          this.sendEvent('DONE', { generationIndex: generationIndex, estimatedTimeMs: avgTimeMsLeft, mapGroups });
        }
      } else {
        this.sendEvent('DONE', { generationIndex: generationIndex, estimatedTimeMs: avgTimeMsLeft, mapGroups });
        this.mapGroupMap = {};
      }
    }
  }

  sendEvent(
    eventType: 'PROGRESS_UPDATE' | 'DONE_GENERATION' | 'DONE',
    data: CrossbreedingOrchestratorEventListenerCallbackData
  ) {
    this.listeners.forEach((listenerCallback) => {
      listenerCallback(eventType, data);
    });
  }

  cancelSimulation() {
    this.terminateAllWorkers();
  }

  terminateAllWorkers() {
    if (this.chunksWorker) {
      this.chunksWorker.terminate();
    }
    this.workers.forEach((worker) => {
      worker.terminate();
    });
  }

  addEventListener(callback: CrossbreedingOrchestratorEventListenerCallback) {
    this.listeners.push(callback);
  }
}

export default new CrossbreedingOrchestrator();
