<template>
  <span>
    <v-btn @click="isDialogOpen = true" v-if="!isScanning">
      Scan Rust
      <v-icon right>
        mdi-monitor-screenshot
      </v-icon>
    </v-btn>
    <v-btn @click="stopCapturing" v-if="isScanning" color="red">
      Stop Scanning
      <v-progress-circular class="ml-2" indeterminate color="primary" size="20"></v-progress-circular>
    </v-btn>
    <v-dialog v-model="isDialogOpen" width="600">
      <v-card>
        <v-card-title class="headline" primary-title>
          <h2 class="text-h5">How to Scan Rust for Saplings?</h2>
        </v-card-title>

        <v-card-text>
          <v-container>
            <ol>
              <li>
                <p>
                  Make sure your <v-chip outlined>USER INTERFACE SCALE</v-chip> setting is set to
                  <v-chip outlined>1.0</v-chip> in Rust.
                </p>
              </li>
              <li>
                <p>
                  Make sure you run game in <v-chip outlined>16:9</v-chip> aspect ratio resolution (1920x1080 or
                  2560x1440 or 4K) and <strong>borderless</strong> mode. If you have a different resolution on your
                  monitor set Rust to <strong>windowed</strong> mode and select a 16:9 ratio resolution.
                </p>
              </li>
              <li>
                <p>Click <strong>SCAN</strong> and select Rust window.</p>
              </li>
              <li>
                <p>
                  Click on a Saplings in your inventory or storage, so that the genes are displayed on the screen. It
                  takes about a second to capture each Sapling.
                </p>
              </li>
              <li><p>Enjoy! If it doesn't work let me know on Discord!</p></li>
            </ol>
          </v-container>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="isDialogOpen = false">
            Close
          </v-btn>

          <v-btn
            color="primary"
            @click="
              isDialogOpen = false;
              startCapturing();
            "
          >
            Scan
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Resemble, { compare } from 'resemblejs';

const SCANNING_INTERVAL = 500;

const MIN_RESEMBLENCE_THRESHOLD = 8.7;
const GENE_IMG_MODELS: { [key: string]: string } = {
  W:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAUCAYAAABvVQZ0AAAAAXNSR0IArs4c6QAABIlJREFUOE89lFlsVVUYhb99hnt6p7bMEWilDYrFMisUEaHcUhAsiLS2xAAiYGI06rPxxRjjIw9qIpJQDNioDFHCoKUig6Uh1AJFELRgLJQOtEC4vb3n3jNsc3aR83L+M+y1117r/5f48P3N0vJcoraNaafRnSya7yGkRAOEECCDYvjmCYGnaXhGCMfKYSgcJqMbuAjER+++IfVMFj09hOU45HhZDN8P1g4v1E2Cy/RdNKQCdDUdWzOxDQMvHMG1QjhCID55a4NMlFeQ99gEBXK7vY3zzacVWOncMibNnqvAbl5opf1sC1JK9b5wzjxcTSPZ101jUyNOyEB8urFazn1+EaOmzkQgSd24xm8/HVYACypXEJv8lKpT169xpvEI0pfMq6gkb0opEsG9q5doOX0cYhHEttdWyeLSmRQtTOALDb/3Fj8f2KsAXqyuhTHjVS0Gujm69zsC5RJVL2NOKEKTks6WE1w93wqWifiidrnMnTiJWWvqcDQdK3mfA9/sRgqo2biJdE5cgUUyg+zbvQvpeayuXYebPwbT92g/uI+7/17H1zXEVzUV0s6JUb7lHRzTIuZm2N/QQCw3ztKq1aR0SzkZdjP8evQQA7091K7fSCoUIeRmObHjc6z04DDYzrVL5GAoTNn6rRj5o8jxHE4cO0Y0N5fZZfPJPHQz5Du0t56j/3YXy1+qYkg3kQ/u07zrS2KODZqOqF9bLoNdSle/Sl5hEYb0aWttJZabT/GUKbhCKAdNJJ3XO+jv7qHsuflKkgddnVzc10DMTYOmIb6uTshBw+LxxZUUTJul9Ln2dwe5+SMYM24sQ6kUnu8Rj8e5e6efgd5eppaUKE27r1yio+kwUdcGoSHqX1ki0yGLkdOfZdoL5ThC52ZPD3kjRhIN59Df1YXve4wtKCSdyXKnp5viggJ06fHnmVP0/d5C1HNUm4hd1QlpB+cfV8CS6jrSusm9tE0kFsP0fTovXcT1XIpnzsHRNFLJJCOjYaXtqR/24926Qfh/sPrqhMxqBg9CUape34IdjqtZCywMRuvy8UZc12FG5UpsPaT6LOS7RDIpDtbvIJ5Oqmel2c6aCulrBoNmDovX1sHYCQRMg2mIuhlO7dmJ47gkNr1JyrDUcQJWQRM3fbtHOWn4rhotsaM6ofIhbYaZs2wl8SdKHoGZyXucrN+uTFm4YSte/qhHYEP//MXZQz8S8Wx0pBp6sb12mRS+T1a3mFy2gPHPLMA2TDTpkbndSdv3e1QMTV9TR6SwCF/oillf21muNp/E8rP4AlKhHMRn61ZIy/PwhMboJ6dSsmyVMsGQHr2XL9LRdEQxm7SokokzAhOGwTp+OUr3lXb1X0bXSefmIbZtrpHGUApdSvRoHkvXbyKrBWAufzSfpvvCOZWKo5+ewezFCRzNUIKf3NvA0EDfcOZFwiTDEcTHb2+QYSeLMZjE9KVKDtUzvqd2DQWpK4Ri5ApdfQ/QNemrVnFiMWwzNKzZB+9tlhHpE8mkMdJpDNdB8zwVL0L6ipWKbhXbQjEJnPMMEy8SIRWysB/G9n8fTxkestcD0wAAAABJRU5ErkJggg==',
  X:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAUCAYAAABvVQZ0AAAAAXNSR0IArs4c6QAABB9JREFUOE9llO+LVFUYxz/n3HPnztwZty0tMqlFFIvUXX+URoabO6JRGbHuuqzmCua7iHodvas/IIhelOa2khBFBiGK2Vb+jE1Dy0AJd12LndpszdWdmfv7xDkzFtEDw9zDved5vt/v830e8fqrO7WXJhSDEDeo48QRMksRWiMBIQRo89D4S4UglZJU5Yi9PLVCgdBRJAjEmy8PaC8IyFWrqDQlQ6IFSK1xdIanU0wkwiExSYREI+x7c46KPpGXJ5AO4q1dvdqpVpFpxqKO5Sxc00koFa7OODP8BX9dumAv1golNm3bQVYo4mQZM7+McuzwIbTQaN/nVqGAeGfrM9pLYjKtqed81g7sQs9qNfiYHh/j/Oef2GT3Ll/Fw0+YQi5eGnP+4AGmx0dROiVSinprK+Ldvg3aTRIrSk3laFvzJPNXrCKSLrk45Ouh3URhwOruPopz51nKwe8TjHy8n1ISWG0jRxL4RcSenrI22pgIHZd66U42bB0g8lssoqvfnWL8yhXWbukndRT5NOaHr45y46dzFNKwqackdHOI9zeXtRLa0jQiB26exZ1dzF66klg6hNf/pFL5jflL2lGmy1OTHP3oQ1qSAC9ryGOaZgqJwc1dWgpbgEQLEqXQrXNY07+D0PONIwijGDfnUUhjxk4M8+v5M1Y3p9lp011MNwc3r9NSCFvB6KalpKryLH7qOWYvfMiiMx+bpM7N6xzft5tiWEXqzHzdQGFCSsRQT1k37PhvmGTp3DY6u/uIVI5MCOu58e9HqJz4klJS/8/39iAkYrC7y4D5XzLZtojHN3UTOcomM0gqF85xdfjQP8luMxJNI4sPesr6NlxDx1w0yDo29dDStoDE0myEV5vm2NB75Gu3LFKnqbW5Z6UY7ClrY1ATmXSIhETdPZfVvS8Q5HyLqG7GreBbW0ycPcXlkZPkkxgnM/40IpkGSMTe3vVaNSsbsY1xl5U30vLgUhKpqF+bpFKpsKBjmfWdujnFkf37KAUz1hoWBMLOqdjdU9ZKZxj+NekS33UP6/u2EXjFhujfnmBsbJR1/dtJlEsuS/n59HEmz57GTxqmNYwCpcw4bWyMkzTj5LFw3UbuW9xuLeEGNb4Z2kMSRzzyfC+leQ+gjY2mrnFy/15aktCqFRs75fKIt/uf1vk0wWyvyJ/F2u07if2SpXRj7DI/Hjxgn+e0r6C9s4vADHqWcGn4MJMXLzQGXTrUW+4wK2iLltUqjtYseXQ19698zL401EeOHObm5Ys2WdUr8uzW7VCaZc/xHxMc+exTiywr5LlV8BFvvDSg83GEOzODm2Vk1jMgssxWNRoZBxiLmN/t5SjILL20WCJw3YZmr73yovZ1hh/WUfU6KomRaWqrC7NNdHN127Ut7Nq2G1e5pL5PNecRNNf230Vw/QsJmvx0AAAAAElFTkSuQmCC',
  Y:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAUCAYAAABvVQZ0AAAAAXNSR0IArs4c6QAAA41JREFUOE+NlN1vVEUYxn8zc87ZbruL1ZZUIw1REmoNES4IYoFC61eJUjAmaoiGRKISTTR+YLwhEeUfIaLGG0OipE2DpimKoUQSbQgGNUUxVbHQgLvtsufMjJn3bEspN85mLvac3d+87/s886h33tzjXVTHJlUyU8PpDK/CdhD24uU1SrZBuxidFYjSEjFFDAb11v7nvE/q1E1VQKDx4ROA4bsKzwI3Ah+hwkYBDu0iYteCTgsYW0C9cWCHT3UNj2Lr5se4u71Lfny5MsXQ8c9xUQXlQdsygwPPUi4sxyvL5NQE342PCjZyTSTpMtSr7/d7q1PwMZ3Lu+jb8DTKx1gzy7GvPmNmbhI83NXazSNbdqFtEa/qDH/zCZeuXgCVYlxCIb0dte+DLd4JTGOyMoP9e1nWfKe0efbncc6cH5HTN655ktUr14E3TF+7yNDYR9joGqHsML84K6Ne+bDHu8ZctC2xdlUfD9y3SWYzU5ni2Ohhmdmuh/dSLoYWU05PjHLu929xpirvtI8wroh6+dBG78lV066Joupg58DzFGiV2Xxx/AhJkjDQ+4xUP+cuc3T4Y+pqGqdruTholIsD7EEf1JOHPiZUt3n9APd2rBX1Js6PC6zrnnWi7E8XTzH+w9c4MytV5jAlB6mXDm0QklfBFBHYiI7WVTy+aTfGFrlydZo4jig330amq3w5epiZ2T9Ap8x3NA+8CSZnNIR4oncPbaVOaSE/zPLXzK+MnPwUG/0rPlu6FmA3XiiMbaF7ZQ/r12yVOYZlzRwnz4zwy5/fy+CD9/4HLBciztp4avsLNJv2UBcV+w9Hh4+Qmis4U7sFFua2IIDSCud97nZXEM9te2gHK9q7pYDf/p5gbHxIvOV1/aaiFgSYt0YQIB9kuIcJJivRF2Bt98vzC5d+5ITAKnIDFq8Fayw2rSg8D7M5rPOOHDbZgIW7uhQWTKttE2rfwV7vzHVJirwsBTb3W/9S2OkhnKncaFP+otAukShSrx181Ke6Csriw8BUsEeCSltugY01YJgUL/PNrRTZIsn1VtTrBwZ9aio4XZf8klCUsots69nOivbVDQHOceLUCM7MBYXEZpoQkBGxLeUR9PZ7u30WzZFFVTI9C8bivJM0nQ/D3LR5UIbDxAYukhyLshImbSIKF/3d/S/6TNew8SzW1GQelrQR23nb0pIQ89iWilyMsU2YtBmdJXIV/wPF6rYeF4/tXQAAAABJRU5ErkJggg==',
  G:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAUCAYAAABvVQZ0AAAAAXNSR0IArs4c6QAAA8JJREFUOE91lF1oXEUYhp+Z87O7TTYb02RNglFLtDWpwTRiEyNNsWql0PhDEcQfqoJaFBR/Kt4UrPbeC8E7b7V3orHQUtG2FDXVJpRGSIJpTUk1VZLmd7O758yMzOw22YgODGfOOTPvfN/3vt8r3n1rv9F+ERUuE3t5tIwxwk4NdlYOIxFuekgdIOMEflRNQAoPD/H2waeNDvMU/UWUF5WO2gNI91wbBiMURsZ2A8IIPJUgUGm8KOXW4s1D/aboLaFlEZAIVcXNdbexdXMXG2uzhGECpRVLywtMXh1n5LdBlFgGoRyg1CGBqiaMahCvfbDL2PTcbTrFHbdso7tzF55JuXQMNl37W2BkgamZUU79cAztWcDYRe+rFInoJsSBD3cY7T4GVIdZ+h98noTMOPCiyjG7ME0ikaS2qskdNF6eweHvGJ86h/ZyCFsQG12cRrz6Ua8x2Fon6Wrvo2PTDoQOWYnnOHl6gPncNQfSt30PLc2t2L3TsxN8++NRlLfkSiqNj6dTiFeO9BgsO3E1u/uepLFmi4Vm7MovnLtwyqVj07296W56u3eB8ckVZvnyxGelVN1uidCBBes2diHjGp7Y8xxpv9lJ4qeLxxmbHMJ4Obc9JENdpglhArQo8NfcBFraWtu/oqSAl49sN1In8OI0+/a+wAaRdRI4MzzA73+OoEXOMWcjshGW2cDIYomc8rCAFWA1PNX/Iknq0RZs6Csmp0fBWKAb9ztanai1LLhLK0cFWKYCLC6BXZ1gW3sP7Zs7ES4yK2JDJBY4OvApypVgbawD27d3PxtEg7vx9NDXXJm6RGd7L1vvvBdbCqF9V59IXufzYx8T+wvr07xBgKczPP7os6sEDI6cYOzyRbL1jWQ3tpBJNNF6axtCe8Ryfh3YKgH/J43xqfMMDp/BiMjprqWhjZ29u12Dx+LfYGVpVIq2864HuKd1Z0m0eoHvzx5nZv4PV6uWbBt99z/8n5FZ0UqVRBw43Ges7Vjqq4J6105JrxYjDJEuMLc4jVaGuppmQi9VIkDO8cU3n6C8xdV2slYkXj/8iImkZcU2eoJNjR30dD1EINKlRreeZqy67Fo5oY5ePs/Pv57EyLyL2jZ6WKhFvHHoMROtWpBwzlGXbqZjy3001DURJpIYY8ivrDBz/Rqjly7w99wUSi4hpEbGwZoFvfP+Myb2V4j9ZWJ7k+0MG4nxSy5hdWp179zAYFDlF4NvQue0JXNMIt47+JKxICrIoby8axNFVLZtiypcZA6zbNuSAKl9B+BFVcg4ROLzD7KA2RvpM/QDAAAAAElFTkSuQmCC',
  H:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAUCAYAAABvVQZ0AAAAAXNSR0IArs4c6QAAAvZJREFUOE+VlF1rXFUUhp+19j5nJplkGrReiCLqj2ilUGhDQQNtrxpEUIIX8Qss2iLeWChtf45e2euitKEfXjSxpU3R1otG/EQEaSYz5+y9ZO85mZmYluLAYS7mzLvX2u/zvnL61JIF3SKUm0TfJ2qNSXoipGfyY4KYIubQWOJDGzfooHWJ0wI59flbFtwWte9lIVCMgGmFSTUSFPMQPfkbASLOPL6axlVtnE0hJ88cs1r7YJ7Xjxzn2dkXMSK3f7zG6p2rmG4hKFrPcOL427R0Lv/+zfWv+fnXn1ATXGhTDrrIh2fnLUpEQ4eF+RPs7byST/3+wWVW714hus28mqv3sHj0Xdqylyg1l777ko3f74FUuFhQ9ueQ988dNCOpz7Jw+H+I3fiKjT/WMe2jpvhqBlk+f8BEPK6aYeHw4o7J1tZXCPro8ZONxNI1gIY2snzhNRMKfN3ljUPNZBJZu3+ZtXsrRHm6WHJdYpHE9ptYgau7E5MJtxoDSAaYoiEZ8A4tmSPqgEsTkyEBEjLLF/aZWAtXpzsbrpkYihmNmuGLia8hFomx4Ho7xNJ7yfEsprGFJrH5bbEWJiHzhljGNk2XTyeJbe4SS+w1YiUaxmumCf5+9Bv/9P7CNJ0qSCx5/rmXcLFNdP0ni4mlaGwb8Gom/PYP11m9cy3/MXMWpnbd2cOMxhaM19xvSpnvbOhmEjNu3V/h5t0Vous1aHRZPLZEm2dy7JIBD/9cB9cHwvA+MxopY2HPGI0mATdTAvwwAb76TwIasRw3AU1ovHf+gIHb4eZ2nJ4q1qyZoPVxGvmgidPYzZfH2UzQuk2I8tjJRnGKjiLMIh+dnbeQgz7TBH23WDZg0H1C0Gu8tYZB//iLoxZcNVFBL+ysID9ATNCqM3IzFee3Ny6y8cuDXEE+TlH0u8gnn71pITVsMSDmMkzAh1yMo8bN0Hokl2MxLsfoKUIHHZTDcjz96ZIF1ye2ek1tDzKo0cb0j5o7V7aiFBO1PY0LZY7Zv8qoATAUBa+LAAAAAElFTkSuQmCC'
};

const SCREEN_GENE_WIDTH = 0.0074;
const SCREEN_GENE_HEIGHT = 0.014;
const SCREEN_GENE_X_POSITION = 0.4165;
const SCREEN_GENE_Y_POSITION = 0.279;
const SCREEN_DISTANCE_BETWEEN_GENES = 0.01405;

const ASPECT_RATIO_169 = 16 / 9;

@Component
export default class SaplingScreenCapture extends Vue {
  isDialogOpen = false;
  intervalRef: number;
  isScanning = false;

  video: HTMLVideoElement;

  videoCanvas = document.createElement('canvas');
  geneCanvas = document.createElement('canvas');

  startCapturing() {
    navigator.mediaDevices
      // TODO: what about windowed mode and the bar at the top?
      .getDisplayMedia({
        video: {
          width: { ideal: 3840 },
          height: { ideal: 2160 }
        },
        audio: false
      })
      .then((mediaStream) => {
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

  startScanning() {
    this.isScanning = true;
    this.$emit('started-scanning');
    this.intervalRef = setInterval(() => {
      this.scanFrame();
    }, SCANNING_INTERVAL);
  }

  stopScanning() {
    this.isScanning = false;
    this.$emit('stopped-scanning');
    clearInterval(this.intervalRef);
  }

  handleStopScanningClick() {
    this.stopScanning;
  }

  scanFrame() {
    const geneScans = this.getSaplingGenesScans();

    const promises: Promise<string>[] = [];
    geneScans.forEach((geneImgData) => {
      promises.push(this.getMostResemblingGene(geneImgData));
    });

    Promise.all(promises)
      .then((keys) => {
        const saplingGenesString = keys.join('');
        this.$emit('sapling-scanned', saplingGenesString);
      })
      .catch(() => {
        // Fail silently. If there was an error it was not possible to find and match all genes from the screen capture.
      });
  }

  getMostResemblingGene(imgData: string): Promise<string> {
    const mainPromise = new Promise<string>((mainResolve, mainReject) => {
      const promises: Promise<{ key: string; rawMisMatchPercentage: number }>[] = [];
      Object.keys(GENE_IMG_MODELS).forEach((key) => {
        const promise = new Promise<{ key: string; rawMisMatchPercentage: number }>((resolve, reject) => {
          compare(
            GENE_IMG_MODELS[key],
            imgData,
            {
              scaleToSameSize: true,
              ignore: 'antialiasing'
            },
            (err: unknown, data: Resemble.ComparisonResult) => {
              if (err) {
                reject();
              } else {
                resolve({ key, rawMisMatchPercentage: data.rawMisMatchPercentage });
              }
            }
          );
        });
        promises.push(promise);
      });

      Promise.all(promises).then((resultList) => {
        const mostResemblingGeneResult = resultList.sort((a, b) =>
          a.rawMisMatchPercentage > b.rawMisMatchPercentage ? 1 : -1
        )[0];
        if (mostResemblingGeneResult.rawMisMatchPercentage <= MIN_RESEMBLENCE_THRESHOLD) {
          mainResolve(mostResemblingGeneResult.key);
        } else {
          mainReject();
        }
      });
    });

    return mainPromise;
  }

  getSaplingGenesScans(): string[] {
    const geneScans = [];
    const aspectRatio = this.video.videoWidth / this.video.videoHeight;
    let yOffset = 0;
    if (aspectRatio !== ASPECT_RATIO_169) {
      const expectedHeight = Math.round(this.video.videoWidth / ASPECT_RATIO_169);
      // If ratio is not 16:9 it means user should use windowed mode and that there is Application Bar at the top.
      yOffset = -(this.video.videoHeight - expectedHeight);
      this.videoCanvas.height = expectedHeight;
    } else {
      this.videoCanvas.height = this.video.videoHeight;
    }
    this.videoCanvas.width = this.video.videoWidth;

    const videoCanvasCtx = this.videoCanvas.getContext('2d');
    if (videoCanvasCtx) {
      videoCanvasCtx.drawImage(this.video, 0, yOffset, this.videoCanvas.width, this.videoCanvas.height - yOffset);
      for (let genePosition = 0; genePosition < 6; genePosition++) {
        const saplingGenesXPixelsStart = Math.round(
          this.videoCanvas.width * (SCREEN_GENE_X_POSITION + SCREEN_DISTANCE_BETWEEN_GENES * genePosition)
        );
        const saplingGenesXPixelsWidth = Math.round(this.videoCanvas.width * SCREEN_GENE_WIDTH);
        const saplingGenesYPixelsStart = Math.round(this.videoCanvas.height * SCREEN_GENE_Y_POSITION);
        const saplingGenesYPixelsWidth = Math.round(this.videoCanvas.height * SCREEN_GENE_HEIGHT);
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
    }
    return geneScans;
  }
}
</script>
