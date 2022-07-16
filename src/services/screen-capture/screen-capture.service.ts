import Jimp from 'jimp';
import { ScreenCaptureServiceEventListenerCallback } from './models';
import { createWorker, PSM } from 'tesseract.js';

const TIME_MS_BETWEEEN_SCANS = 200;

const SCREEN_GENES_HEIGHT = 0.015;
const SCREEN_GENES_WIDTH = 0.081;
const SCREEN_GENE_X_POSITION_START = 0.415;
const SCREEN_GENE_Y_POSITION_START = 0.279;

const ASPECT_RATIO_169 = 16 / 9;

class ScreenCaptureService {
  listeners: ScreenCaptureServiceEventListenerCallback[] = [];

  video: HTMLVideoElement;
  worker: Tesseract.Worker;
  videoCanvas = document.createElement('canvas');
  geneCanvas = document.createElement('canvas');

  startCapturing() {
    navigator.mediaDevices
      .getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      })
      .then(async (mediaStream) => {
        this.worker = createWorker();
        // {logger: (m) => console.log(m)}
        await this.worker.load();
        await this.worker.loadLanguage('eng');
        await this.worker.initialize('eng');
        await this.worker.setParameters({
          // eslint-disable-next-line @typescript-eslint/camelcase
          tessedit_char_whitelist: 'GHYWX6',
          // eslint-disable-next-line @typescript-eslint/camelcase
          tessedit_pageseg_mode: PSM.SINGLE_LINE
        });

        this.video = document.createElement('video');
        this.video.srcObject = mediaStream;
        this.video.addEventListener('loadedmetadata', () => {
          this.startScanning();
        });
        const track = mediaStream.getVideoTracks()[0];
        track.addEventListener('ended', () => {
          this.stopScanning();
        });
        this.video.play();
      })
      .catch(() => {
        // Fail silently. It's likely that permission to capture screen was denied by the User.
      });
  }

  stopCapturing() {
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

  private startScanning() {
    this.listeners.forEach((listenerCallback) => {
      listenerCallback('STARTED');
    });

    this.scanFrameRecurrent();
  }

  private scanFrameRecurrent() {
    window.requestAnimationFrame(() => {
      this.scanFrame().then(() => {
        setTimeout(() => {
          this.scanFrameRecurrent();
        }, TIME_MS_BETWEEEN_SCANS);
      });
    });
  }

  private async stopScanning() {
    await this.worker.terminate();
    this.listeners.forEach((listenerCallback) => {
      listenerCallback('STOPPED');
    });
  }

  private scanFrame() {
    const promise = new Promise((resolve) => {
      const geneScan = this.getSaplingGenesScan();
      if (geneScan) {
        // console.log(geneScan);
        Jimp.read(geneScan).then((image) => {
          image
            .greyscale()
            .invert()
            .normalize()
            .contrast(0.4)
            // .color([{ apply: 'tint', params: [50] }])
            .getBase64('image/png', async (err, data) => {
              console.log(data);

              let {
                data: { text }
              } = await this.worker.recognize(data);
              console.log(text);
              text = text.replace(/\s/g, '');
              text = text.replaceAll('6', 'G');
              console.log(text);

              if (text.match(/^[GHYWX]{6}$/g)) {
                this.listeners.forEach((listenerCallback) => {
                  listenerCallback('SAPLING-FOUND', text);
                });
              }
              resolve(null);
            });
        });
      }
    });
    return promise;
  }

  private getSaplingGenesScan(): string | null {
    const aspectRatio = this.video.videoWidth / this.video.videoHeight;
    let yPXOffset = 0;
    if (aspectRatio !== ASPECT_RATIO_169) {
      const expectedHeight = Math.round(this.video.videoWidth / ASPECT_RATIO_169);
      // If ratio is not 16:9 it means user should use windowed mode and that there is Application Bar at the top.
      yPXOffset = -(this.video.videoHeight - expectedHeight);
      this.videoCanvas.height = expectedHeight;
    } else {
      this.videoCanvas.height = this.video.videoHeight;
    }
    this.videoCanvas.width = this.video.videoWidth;

    const videoCanvasCtx = this.videoCanvas.getContext('2d');
    if (videoCanvasCtx) {
      videoCanvasCtx.drawImage(this.video, 0, yPXOffset, this.videoCanvas.width, this.videoCanvas.height - yPXOffset);
      const saplingGenesXPixelsStart = Math.round(this.videoCanvas.width * SCREEN_GENE_X_POSITION_START);
      const saplingGenesXPixelsWidth = Math.round(this.videoCanvas.width * SCREEN_GENES_WIDTH);
      const saplingGenesYPixelsStart = Math.round(this.videoCanvas.height * SCREEN_GENE_Y_POSITION_START);
      const saplingGenesYPixelsWidth = Math.round(this.videoCanvas.height * SCREEN_GENES_HEIGHT);
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
        return this.geneCanvas.toDataURL();
      }
    }
    return null;
  }

  addEventListener(callback: ScreenCaptureServiceEventListenerCallback) {
    this.listeners.push(callback);
  }
}

export default new ScreenCaptureService();
