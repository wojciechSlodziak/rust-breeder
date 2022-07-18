import Jimp from 'jimp';
import { ScreenCaptureServiceEventListenerCallback } from './models';
import { createWorker, PSM } from 'tesseract.js';

const TIME_MS_BETWEEEN_SCANS = 200;

const DIMENSIONS: {
  [key: string]: { [key: string]: number };
} = {
  REG1: {
    WIDTH: 0.008,
    HEIGHT: 0.015,
    X_POSITION_CENTER: 0.42,
    Y_POSITION_CENTER: 0.286,
    DISTANCE_BETWEEN: 0.01405
  },
  REG2: {
    WIDTH: 0.01,
    HEIGHT: 0.0185,
    X_POSITION_CENTER: 0.617,
    Y_POSITION_CENTER: 0.3512,
    DISTANCE_BETWEEN: 0.0241
  }
};

const SUPPORTED_ASPECT_RATIO = 16 / 9;

class ScreenCaptureService {
  listeners: ScreenCaptureServiceEventListenerCallback[] = [];

  isActive = false;
  video: HTMLVideoElement;
  workers: Tesseract.Worker[] = [];
  videoCanvas = document.createElement('canvas');
  geneCanvas = document.createElement('canvas');

  startCapturing() {
    this.isActive = true;
    navigator.mediaDevices
      .getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      })
      .then(async (mediaStream) => {
        await this.setupRecognitionWorkers();

        this.video = document.createElement('video');
        this.video.srcObject = mediaStream;
        this.video.addEventListener('loadedmetadata', () => {
          this.startScanning();
        });
        const track = mediaStream.getVideoTracks()[0];
        track.addEventListener('ended', () => {
          this.stopCapturing();
        });
        this.video.play();
      })
      .catch(() => {
        // Fail silently. It's likely that permission to capture screen was denied by the User.
      });
  }

  stopCapturing() {
    this.isActive = false;
    this.stopScanning();
    const stream: MediaStream = this.video.srcObject as MediaStream;
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => {
        track.stop();
      });
      this.video.srcObject = null;
    }
  }

  async setupRecognitionWorkers() {
    this.listeners.forEach((listenerCallback) => {
      listenerCallback('INITIALIZING');
    });
    if (this.workers.length === 0) {
      this.workers = await Promise.all(
        Array(12)
          .fill(0)
          .map(async () => {
            const worker = createWorker();
            await worker.load();
            await worker.loadLanguage('eng');
            await worker.initialize('eng');
            await worker.setParameters({
              // eslint-disable-next-line @typescript-eslint/camelcase
              tessedit_pageseg_mode: PSM.SINGLE_CHAR
            });
            return worker;
          })
      );
    }
  }

  private startScanning() {
    this.listeners.forEach((listenerCallback) => {
      listenerCallback('STARTED');
    });

    this.scanFrameRecurrent();
  }

  private scanFrameRecurrent() {
    if (this.isActive) {
      window.requestAnimationFrame(() => {
        this.scanFrame().then(() => {
          setTimeout(() => {
            this.scanFrameRecurrent();
          }, TIME_MS_BETWEEEN_SCANS);
        });
      });
    }
  }

  private async stopScanning() {
    this.listeners.forEach((listenerCallback) => {
      listenerCallback('STOPPED');
    });
  }

  private scanFrame() {
    const allGeneScans = this.getSaplingGenesScans();

    const promises: Promise<string | null>[] = [];
    allGeneScans.forEach((geneScans, regionIndex) => {
      geneScans.forEach((geneImgData, index) => {
        promises.push(this.getRecognizedGene(geneImgData, regionIndex * 6 + index));
      });
    });

    return Promise.all(promises).then((results) => {
      [results.slice(0, 6), results.slice(6, 12)].forEach((regionGenes) => {
        const saplingGenesString = regionGenes.map((gene) => (gene ? gene : '')).join('');
        if (saplingGenesString.match(/^[GHYWX]{6}$/g)) {
          this.listeners.forEach((listenerCallback) => {
            listenerCallback('SAPLING-FOUND', saplingGenesString);
          });
        }
      });
    });
  }

  private getRecognizedGene(imgData: string, workerIndex: number): Promise<string | null> {
    const promise = new Promise<string | null>((resolve) => {
      Jimp.read(imgData).then((image) => {
        image
          .greyscale()
          .invert()
          .normalize()
          .scale(2)
          .convolute([
            [0, -0.5, 0],
            [-0.5, 4, -0.5],
            [0, -0.5, 0]
          ])
          .contrast(0.5)
          .getBase64('image/png', async (err, data) => {
            let {
              data: { text }
            } = await this.workers[workerIndex].recognize(data);

            text = text.replace(/\s/g, '').toUpperCase();

            if (text.match(/^[GHYWX]{1}$/g)) {
              resolve(text);
            } else {
              resolve(null);
            }
          });
      });
    });
    return promise;
  }

  private getSaplingGenesScans(): string[][] {
    const allGeneScans: string[][] = [];
    const aspectRatio = this.video.videoWidth / this.video.videoHeight;
    let yPXOffset = 0;
    if (aspectRatio !== SUPPORTED_ASPECT_RATIO) {
      const expectedHeight = Math.round(this.video.videoWidth / SUPPORTED_ASPECT_RATIO);
      // If ratio is not 16:9 it means user should use windowed mode and that there is Application Bar at the top.
      yPXOffset = -(this.video.videoHeight - expectedHeight);
      this.videoCanvas.height = expectedHeight;
    } else {
      this.videoCanvas.height = this.video.videoHeight;
    }
    this.videoCanvas.width = this.video.videoWidth;

    const videoCanvasCtx = this.videoCanvas.getContext('2d');
    if (this.videoCanvas.width !== 0 && videoCanvasCtx) {
      videoCanvasCtx.drawImage(this.video, 0, yPXOffset, this.videoCanvas.width, this.videoCanvas.height - yPXOffset);
      ['REG1', 'REG2'].forEach((key) => {
        const geneScans = [];
        for (let genePosition = 0; genePosition < 6; genePosition++) {
          const saplingGenesXPixelsStart = Math.round(
            this.videoCanvas.width *
              (DIMENSIONS[key].X_POSITION_CENTER -
                DIMENSIONS[key].WIDTH / 2 +
                DIMENSIONS[key].DISTANCE_BETWEEN * genePosition)
          );
          const saplingGenesXPixelsWidth = Math.round(this.videoCanvas.width * DIMENSIONS[key].WIDTH);
          const saplingGenesYPixelsStart = Math.round(
            this.videoCanvas.height * (DIMENSIONS[key].Y_POSITION_CENTER - DIMENSIONS[key].HEIGHT / 2)
          );
          const saplingGenesYPixelsWidth = Math.round(this.videoCanvas.height * DIMENSIONS[key].HEIGHT);
          const imgData = videoCanvasCtx.getImageData(
            saplingGenesXPixelsStart,
            saplingGenesYPixelsStart,
            saplingGenesXPixelsWidth,
            saplingGenesYPixelsWidth
          );
          const geneCanvasCtx = this.geneCanvas.getContext('2d');
          this.geneCanvas.height = imgData.height;
          this.geneCanvas.width = imgData.width;
          if (geneCanvasCtx) {
            geneCanvasCtx.putImageData(imgData, 0, 0);
            geneScans.push(this.geneCanvas.toDataURL());
          }
        }
        allGeneScans.push(geneScans);
      });
    }
    return allGeneScans;
  }

  addEventListener(callback: ScreenCaptureServiceEventListenerCallback) {
    this.listeners.push(callback);
  }
}

export default new ScreenCaptureService();
