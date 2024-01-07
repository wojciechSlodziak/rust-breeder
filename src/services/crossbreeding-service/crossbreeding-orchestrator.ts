import ChunksWorker from 'worker-loader!./chunks.worker';
import CrossbreedingWorker from 'worker-loader!./crossbreeding.worker';
import ApplicationOptions from '@/interfaces/application-options';
import {
  resultMapGroupsSortingFunction,
  appendAndOrganizeResults,
  getBestSaplingsForNextGeneration,
  linkGenerationTree
} from './helper';
import {
  CrossbreedingOrchestratorEventListenerCallback,
  CrossbreedingOrchestratorEventListenerCallbackData,
  GenerationInfo,
  GeneticsMapGroup,
  ProcessingStat,
  SimulatorEventType,
  WorkChunk
} from './models';
import Sapling from '@/models/sapling.model';
import { WORK_CHUNKS_PER_WORKER } from './config';

const PARTIAL_RESULT_INCREMENTAL_UPDATE_FREQUENCY_MS = 1000;
const ESTIMATION_TIME_UNIT_MS = 10000;
const ESTIMATION_SENT_AFTER_MS = ESTIMATION_TIME_UNIT_MS / 10;

class CrossbreedingOrchestrator {
  listeners: CrossbreedingOrchestratorEventListenerCallback[] = [];
  sourceSaplings: Sapling[];
  generationInfo: GenerationInfo;
  options: ApplicationOptions;

  chunksWorker: ChunksWorker;
  workers: CrossbreedingWorker[];
  combinationsToProcess: number;
  combinationsProcessedSoFar: number;
  mapGroupMap: { [key: string]: GeneticsMapGroup } = {};

  processingStats: ProcessingStat[];
  startTimestamp: number;
  lastPartialResultUpdateTimestamp: number;
  timeBetweenSubsequentPartialUpdates: number;

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
    this.sourceSaplings = sourceSaplings;
    this.generationInfo = generationInfo;
    this.options = options;
    const { numberOfWorkers } = options;

    this.startTimestamp = new Date().getTime();
    this.lastPartialResultUpdateTimestamp = new Date().getTime();
    this.timeBetweenSubsequentPartialUpdates = PARTIAL_RESULT_INCREMENTAL_UPDATE_FREQUENCY_MS;

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
          this.handleWorkerMessage(event);
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

  handleWorkerMessage(event: MessageEvent) {
    // Handling partial results.
    appendAndOrganizeResults(this.mapGroupMap, event.data.partialMapGroupMap);

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
      (stat) => stat.timestamp > currentTimestamp - ESTIMATION_TIME_UNIT_MS
    );
    let avgTimeMsLeft = null;
    if (currentTimestamp - this.startTimestamp >= ESTIMATION_SENT_AFTER_MS) {
      const avgCombinationsPerMs =
        this.processingStats.reduce((acc, val) => acc + val.combinationsProcessed, 0) /
        Math.min(ESTIMATION_TIME_UNIT_MS, currentTimestamp - this.startTimestamp);
      avgTimeMsLeft = (this.combinationsToProcess - this.combinationsProcessedSoFar) / avgCombinationsPerMs;
    }

    // Progress updates notfication.
    const progressPercent = Number(((this.combinationsProcessedSoFar / this.combinationsToProcess) * 100).toFixed(2));
    this.sendEvent(SimulatorEventType.PROGRESS_UPDATE, {
      generationIndex: this.generationInfo.index,
      estimatedTimeMs: avgTimeMsLeft,
      progressPercent
    });

    // Partial result updates.
    if (currentTimestamp - this.lastPartialResultUpdateTimestamp >= this.timeBetweenSubsequentPartialUpdates) {
      this.sendPartialResultsEvent();

      this.lastPartialResultUpdateTimestamp = currentTimestamp;
      this.timeBetweenSubsequentPartialUpdates += PARTIAL_RESULT_INCREMENTAL_UPDATE_FREQUENCY_MS;
    }

    // Handling complete generation results.
    if (this.combinationsProcessedSoFar === this.combinationsToProcess) {
      this.terminateAllWorkers();
      this.sendGenerationDoneEvent();
      this.tryCalculateNextGeneration();
    }
  }

  linkAndReturnCurrentSortedResults() {
    linkGenerationTree(this.mapGroupMap);
    return Object.values(this.mapGroupMap).sort(resultMapGroupsSortingFunction);
  }

  sendEvent(eventType: SimulatorEventType, data: CrossbreedingOrchestratorEventListenerCallbackData) {
    this.listeners.forEach((listenerCallback) => {
      listenerCallback(eventType, data);
    });
  }

  sendPartialResultsEvent() {
    const currentResults = this.linkAndReturnCurrentSortedResults();
    if (currentResults.length > 0) {
      this.sendEvent(SimulatorEventType.PARTIAL_RESULTS, {
        generationIndex: this.generationInfo.index,
        mapGroups: currentResults
      });
    }
  }

  sendGenerationDoneEvent() {
    this.sendEvent(SimulatorEventType.DONE_GENERATION, {
      generationIndex: this.generationInfo.index,
      mapGroups: this.linkAndReturnCurrentSortedResults()
    });
  }

  sendCalculationDoneEvent() {
    this.sendEvent(SimulatorEventType.DONE, {
      generationIndex: this.generationInfo.index
    });
  }

  calculateNextGeneration() {
    const mapGroups = Object.values(this.mapGroupMap).sort(resultMapGroupsSortingFunction);
    const additionalSourceSaplings = getBestSaplingsForNextGeneration(
      this.sourceSaplings,
      mapGroups,
      this.generationInfo.index,
      this.options.numberOfSaplingsAddedBetweenGenerations,
      this.options.geneScores
    );
    if (additionalSourceSaplings.length > 0) {
      const newGenerationInfo: GenerationInfo = {
        index: this.generationInfo.index + 1,
        addedSaplings: additionalSourceSaplings.length
      };
      const nextGenerationSourceGenes = [...additionalSourceSaplings, ...this.sourceSaplings];
      this.simulateBestGenetics(nextGenerationSourceGenes, newGenerationInfo, this.options);
    } else {
      return false;
    }
    return true;
  }

  skipToNextGeneration() {
    this.terminateAllWorkers();
    this.sendGenerationDoneEvent();
    this.tryCalculateNextGeneration();
  }

  tryCalculateNextGeneration() {
    let isCalculatingNextGeneration = false;
    if (this.generationInfo.index < this.options.numberOfGenerations) {
      isCalculatingNextGeneration = this.calculateNextGeneration();
    }

    if (!isCalculatingNextGeneration) {
      this.onCalculationDone();
    }
  }

  onCalculationDone() {
    this.sendCalculationDoneEvent();
    this.mapGroupMap = {};
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
