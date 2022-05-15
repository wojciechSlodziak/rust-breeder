<template>
  <span>
    <v-btn @click="isDialogOpen = true" v-if="!isScanning">
      Scan Rust
      <v-icon right>
        mdi-monitor-screenshot
      </v-icon>
    </v-btn>
    <v-btn @click="stopCapturing" v-if="isScanning" color="error">
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
                  <strong>1.0</strong> in Rust.
                </p>
              </li>
              <li>
                <p>
                  Make sure you run game in <v-chip outlined>16:9</v-chip> aspect ratio resolution (1920x1080 or
                  2560x1440 or 4K) and borderless mode. If you have a different resolution on your monitor set Rust to
                  <strong>windowed</strong> mode and select a 16:9 ratio resolution.
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

const MIN_RESEMBLENCE_THRESHOLD = 80;
const GENE_IMG_MODELS: { [key: string]: string } = {
  W:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAQCAYAAAAbBi9cAAAAAXNSR0IArs4c6QAAA7FJREFUOE8tk+tPFFcchp+zMzvssuxyK0gQFIlaRdAqLWAxguXmBamGBW2DkUiatkn/iaZf2y9NmqbagrFKUrXYmOCtaBGVegmCNxqq1CpVF4FSC3ubnZnTzND5eE7Oc37ve54Rn37ysaypqiI9Jwe3ZfLi3gjD164gpaSkrJyCDWXY38TIEPduXnfW17xVztLSMnSXwqupSX6+eAnxWXubrKisJKuoBIFk/o8xBi+cdw68XdeAf/kqJBB5/JDB82cREspqagmsLEIimBl7wODAAOKLtha5vLiEZZuqsYRAvnzBuZ6TzhTbmlsgK8cBiZlJzp08gQBqdr6LmpuPC3jy61XGRoYRX723S/pzF7NhdysJl4I294qe7u8RwkVw336iXp8DSo5H+PHoETBMmlr3YqRnolomd0+fYnbiCeLgnkYZS/JS3fERhjsJn6HT092NL+CnbmcTEUXDHsNj6PxytpfZyZe07ttHWPOgGQn6Ow+iRcOIztbtcl5NoqKtHTUtA49pcLmvj+RAgPXlG9EVxYmpWSZ3bt3g71CI+h07iCpurH//YfBIJylGHHHYAbkpbmomdUkBqmUxNDSEP5BG4esrMYQLKS3cdh/j48xMhiivqCDhcjH3bIK7p47jS+iIwy1bZVjVKKiuJa94nXP72MNHBNLSyVqUTSQcxrRM/P4AM1PTDmhN0Wqnt+ej9xm/eI4UM7EAiqgaGSXrKdlcTUIoTIRCpKZn4PN6mH72DMsyyc5fQjSuMxUKsSw/D1VajA5eYer2TZINHdEVrJdxVUMuWsyW5lZiisZsNEpySgpuy+LpvTsYpkHhG6VOnPDcHBm+ZJLMBAM/9WD+9SdeU0d0BuulrqjMack07u8g7k0hrqi2OXjMBA8uXcBIGKxr2E5MsZuSaJaBNx7ldNchAvEwmmkgvg3WSdOlMu/28E5wLyI71zlgW26rMHC0C13XqT3wIXaXts32NLagfT8cw2/EHJ/EoWC9tDejmofS+u34VxQRU1QH5J6bpf+7b5wH2Nz+AWZa5v8gg8jjMa73nibFjmWvft26VSqWdOKs2LiJ3DcrialuXNIk/vwpt48fc0Brd+/Bt7QQSyhO5MnhG4xe7cdrGRh2EV++3yi1RAJLuHhtxSqKtu1yZFOlyeSDOzzq63VABVUN5K2zC18A/d53htBvd1GkSUxREJ93tEg1EnZEdPtTqWs7gO5SHdD9awO8GLnlgDJXr6V0S93C/2gZXD7RTXj6JaYiSHi9/Ae+1qvV39LmIgAAAABJRU5ErkJggg==',
  X:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAQCAYAAAAbBi9cAAAAAXNSR0IArs4c6QAAA0VJREFUOE9NlOtvlEUUxn8z72Xf7W43NRgvqaapNAZNKZcGEdC2gDYBYzVdXVtNCx80/i1+JH4w1oIQJcYLXxSrgg0XkQZBrMYGE+xaG9q1KtXW7uW9zZh3tkDPtzMz55nnPOeZEYdef1nLlf+wlaKtYzPrdzxJYDnYKubK+Gn+ufYzEkU5laFv6AAqncVSipXZac6MnQQJkZdGvPnKszodRWitqDgeXcOvohubkGiWZopMfvoJUmvu27KNR5/oxpcOqTjkh89OsDQzjUVMYNuItwf2aycOAU1FOrTs6qF162ME0sENfc4cGyXwq2zvf4nM/c0kUftjjksfHScb1RBoAikR7xR6taOUAfItm2qmid7BYfxMzjCZvTzBb8VpugqDxJaNF4dMjp9iaWqSdOwb4EhIxOEX9morgdGKSFhUbZeN3U+xrqOTQFr4i38zP1+itb3D6CZuLnDqg/fIRTVclXQCSgjEkfwendAzIS2CRJ277mbX4EF8rwEB+EGI46ZIxyHFb8aZvfodKRViqXi1TiLezfesoiRrAoWg7Hi073uedW0bCKWFRhhAa3mRc8dGyPhlpFYIvVoqQBzp7zKZEAJtNgQVy0M/8BDd/QUCO2WoW1ox8/0l5s6fJhtW60zWxG2gtYsV28NufYSdff1megmQ1DFzP13l9/ExsmENxJpGkutvMaoDCVO0Yntsfa5ArqWNaLU1UKQqy5w9OoJXWTYMEyFuhTjc331bbCUkobCx721mR2GImps2FqjWarjpBrw44MblC1yfuIAX+9i6LrbRcDTfrZPDxg/SpmKl6Ox9htyGjfX8zxKlUon1m7YYUHvpJl8eP0pjsIIbBXfGP5Lv0bauU6xZLmHTPcaQVS9TF/jiWYrFIrsHh4kdFzeO+eXiORaufEtDVLtjyLde3K1dpQy9hM3De/bR3L7ZjN2ulY0mYeCzLT9AY3OLOacW/+L8+6NmesmDDpMncmhgr/aiBEgSNOToOfAaUbrRtPFv8To/nvzYeCZx+qaep/Gli6sirn39OfNTkzg6IrQl4o3h/ToVBFhK0LF9Jw92Pk4o69/IxFdjLP86hVAx5VSWvqGDkMlhaY2/cIMvTnwIxISuw/9awoIfNJe9zQAAAABJRU5ErkJggg==',
  Y:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAQCAYAAAAbBi9cAAAAAXNSR0IArs4c6QAAAt9JREFUOE99k/9r1VUYx1/POZ9799l1buK2vpBfStJWgfshTHd1tjarmbCyQCgKBB1Sf4I/FGLrD6lGQWBBuoVaMFfDtiWVK0hRqQYTrV3U2+1uu+c8cc5n4I1Jz4+Hc17n/X4/zyNvvXNAva0iKLuLvaxr24xgmC/PMXL2BD75G8JJbRUD/QdoTttQPFfmZjg/NQ5eSHwBOXJsn3q7gPGWh9ofpW/bfkTzOFvh5NlPma/+BgoPrnmM57oHsK4Rbxb58ttPuHHrd1RrGJ8ig+/tUc8CRgx2qYmBZw/SUrgfFcfM5SkuXP6aUDue7GfLxk5EDX/enmXkm2FcUgZVjM8jg0M9qrKEQJS/ddMzdHZ0IZpQKl/n5NhHEfRy30FWp62oqTF98Ry//DGBM8E2GJ8E0G711DAiiEtJaWf/3tdp0Jao6vMzw6RpSn/3q4haKv4vPhsdZtHMEyIRjagA2qUen4F8DuMK7HzqeTY9EGxYLl6aJpfL0fFIJyo1fp2d5vwPX6H2H4KTrAQ5NFTMmCKgBuNz3Nf8MC/sei1CS7duksslNBVacKbCF2MfUKrMZhDxyyACqKsOJLH1ZmkVe7vfoL15I6IhPaLNudJVTk98nIVcB4maBt8vqlcfw15+EZU8vqGLbVt7sC5FUZytMnHhDFfmvsfbLOT6ksNDOzQOSl0Z10hSW8srL75JwbSGCCjXbnJi9ENcUkJt9V6g7StAuDy21kxvcYD1rR3x0bUbM4xPjuCSO6hZQPXu5yIGOXT8aV3h1+cxrom+4kusX/vEMugnzk2N4sxt1Cz+V5Ea5PDx7RraGvVnISERtHoFaGxyBG+DogCqU6RhII8V1dv6H/4PdApvyzipZuOyPENxRY6826MuqaCxneGXAGq4h6IfGZs8hTN34tLGe8GFWhLXiLx9tF99voIzi3gTLIbskzgCvTv3sa5tSzy7dv1nxr87ne1XjMIgPskWdqGBfwHg4k9ZBuFPLwAAAABJRU5ErkJggg==',
  G:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAQCAYAAAAbBi9cAAAAAXNSR0IArs4c6QAAAzRJREFUOE9tk91PnEUUxn9n5mV3gS6ltFBYlUjQCra00rSAtNKgofU72sa7xmqkfv0JxsQP8M7EGy+9tDdemIhpUoxGNEaxtUTFGFqIIKV109QuRWAXdt85ZmY3vdG5e2fe+c1znvMcef3N4xpHqzi7AQgmrqZp21107TpAQ30TiUSS2MWsrq3w59XL/Do7ibMFkBKiBiklMMUa5JW3j2ls1hABcUnuubOb3u5BIleNqEVxng8qqNnkyt8zTHx/FmfXcRRBLVFcg7z87qCqFBGN2JJo4qnBkyRNnb/JZrzOzZUsyWSK+toWUIPaDX6Y+orZaxdwNo9fJk4ip0ceUn/JuBT77x+gq+0w4qpYLy3zxcQY/+SvoyoM9DxOa6bdC+PajTm+nPwEF62GB4ktMjx6SH2ttrSFowPP0lx3b/Bq5spPnP9lAmfXUCe0ZfZyqOfhoHxt4yafjn8UzsLyXg2PPqiiVUSlNM88epJ01IKKY3L6HJcWp/D+eRkJ2cqO+gz+X8cG2eVZ1BTKIAQZfq9PxSUC6MQTp6iRJlRivp0aY/6vadQWwrd6+dgARRwqmyBxBYQH9arvlgc99+QLpGisgD5j/urvQZ0RQd3tO6gp4bwaKYZNp+pBPRVQ3X9AC0tzPNDZx56O7uCN99KbWzQrnBn7EGe92ZXiXho9EEC25EEvhtK85G+mxlhc+oN9HX3sue8gxiURF3k32DQ5Pj77PnF0K6gxYpAyKBFAxx97nnSUCR78+Ns4l+anady+k507WtmabKG9tRNxlqK5dRtU1uNBIwfVJ9jGaY4NnKC5blc4uLx0kcmLE8EPn6vWpt0c6T+KcVUU5X9AwyO95UDG1XR3HmZf+yBeYd6t8PV357ieWwxj0Naym4G+oYqi5aCoaJcxRsqBPP1Ov4ZX1VIbNfL0I6dImW2hy0VXILeaxcXK9nSGhK2pmJ3jzOcfULIr5UF3CeTVt45o7GdGFHEp7m7eS//+IaokHTrl2x8i5wdYYpzJM7NwgcnpcdTkw35UqkZee2NINVGgJD6lButqaUjfQVdHL40NLWFgVZVCIc+NXJaZuZ/J5hbCeAhx6KbZSPEv99x7/XkSad8AAAAASUVORK5CYII=',
  H:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAQCAYAAAAbBi9cAAAAAXNSR0IArs4c6QAAAoZJREFUOE+dlO9Lk1EUx7/n3k2Xc1o5XxQR5n9hSLik0uG00hn9QKhc4Z/Qm8Jy/03Wi+ilEyQ1NXBT2GbNCIeUGvgmTd3uc+KcrVLojT1w4T7c+3zu9/s95z408vQ2s9kDmHCtM4pw6CwYHpYLc8jk5+GZfRAbWFeH/tgdBOikrk/OvcX6ty8ALIyrAz0ajTGoDOMC6I5cR3OwRTcufZ5GOj8DZ3+CYOArhRDvGUIATWBySH14jeLWR53Lt5R4cZUBhnVBdHfcOCZoBR6VQOwHJcYiDBBsOYTujpvHB5l9AAaUSF5iYh/Mf4Hy8MwBxBENJ9vZsF8VdXX0qyJ5lgvzyOSqYatiCfsuAtQIz5SqGQloHwwHepC8yMargd+JtX6Egy2Qd9ksQYI8ORCimtjqkAJMLLxCcSsPFhAdAvnK9YhGBqqgWl1kgUAGaQuAjVbQ2V1VtLaZVRAZ76+iwyA5fXtnAz/2tsFUBnuA5VqcaT4PywF4du8ICKLoYbKNSa01/LEmCqQh09k5sDlQNcadwEDvvWpGB5hYGP9jTUHDY21MXAOr1uJqTUKRhlzMzaDS9UaLEY9JQ54GmzJSVZCELfarID98Un7N6IJmkylMIb0yDUe7qsjvGhGP3UcAYbWbmh9H8Xs1bAU9b2MiXxUkio6C2O6qIl+5AfGe3yCH1MJLrG3mACt9BFBitJ1lYl09opcHEQ62asnThSks5t/BszuVS1tqxK1eATVX7pqCsoAtAc6AHj+LcOXiBRHtFEWt6jmzOoXFXAUkV+BfoOJGDkwl7TsaedLF7HcAW3Rd6UNT6JyClj7NIp2dhWflN0J60GDfEGrplCqefP8G619XdY1KfvwCEzKaf8WuvLAAAAAASUVORK5CYII='
};

const SCREEN_GENE_WIDTH = 0.0074;
const SCREEN_GENE_HEIGHT = 0.0118;
const SCREEN_GENE_X_POSITION = 0.4166;
const SCREEN_GENE_Y_POSITION = 0.281;
const SCREEN_DISTANCE_BETWEEN_GENES = 0.0141;

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
              scaleToSameSize: true
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
        console.log('mostResemblingGeneResult', mostResemblingGeneResult.rawMisMatchPercentage);
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
      // console.log(yOffset);
      this.videoCanvas.height = expectedHeight;
    } else {
      this.videoCanvas.height = this.video.videoHeight;
    }
    this.videoCanvas.width = this.video.videoWidth;

    const videoCanvasCtx = this.videoCanvas.getContext('2d');
    if (videoCanvasCtx) {
      videoCanvasCtx.drawImage(this.video, 0, yOffset, this.videoCanvas.width, this.videoCanvas.height - yOffset);
      for (let genePosition = 0; genePosition < 6; genePosition++) {
        const saplingGenesXPixelsStart =
          this.videoCanvas.width * (SCREEN_GENE_X_POSITION + SCREEN_DISTANCE_BETWEEN_GENES * genePosition);
        const saplingGenesXPixelsWidth = this.videoCanvas.width * SCREEN_GENE_WIDTH;
        // console.log(this.videoCanvas.height);
        const saplingGenesYPixelsStart = this.videoCanvas.height * SCREEN_GENE_Y_POSITION;
        const saplingGenesYPixelsWidth = this.videoCanvas.height * SCREEN_GENE_HEIGHT;
        // console.log(
        //   this.videoCanvas.width,
        //   this.videoCanvas.height,
        //   saplingGenesXPixelsStart,
        //   saplingGenesYPixelsStart,
        //   saplingGenesXPixelsWidth,
        //   saplingGenesYPixelsWidth
        // );
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
          // console.log(this.geneCanvas.toDataURL());
          geneScans.push(this.geneCanvas.toDataURL());
        }
      }
    }
    return geneScans;
  }
}
</script>
