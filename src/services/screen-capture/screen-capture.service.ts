import Resemble, { compare } from 'resemblejs';
import { ScreenCaptureServiceEventListenerCallback } from './models';

const TIME_MS_BETWEEEN_SCANS = 200;

const MIN_RESEMBLENCE_THRESHOLD = 50;
const GENE_IMG_MODELS: { [key: string]: string } = {
  W:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAYAAABy6+R8AAAAAXNSR0IArs4c6QAAAk1JREFUKFMlks9PknEAxj/fl/cHr/mjKaPEYGsDxZyoA3FI02VzK2d5aXXo2B/gpUOH7m2tzQ4t/43WoTy4VsYmqGMTEWcqmAkalkpzBPriW+BzeU6fZ5/DIyYnRk1FVrhWOkFIArViUI3Eea3PJKnWR4qOYVRIq3WI6efPTF+PD9mqs7KywsF6inA4TL27k+XlBPmlCH6/H70nQKFQIDP7ATH1dNLs7eujqcVGIpGgvJelt7cH1eVma2uLXPQzAb8fydvN7u4u2blZxJsnj81AfwC1vZvk6iqlwjGdnV5U+1X2cjky8xH6+wM0tLlYS6UofplBvHh03wyFQtR3B8ik03BawuVyweVmjo+P2Isv4vV2ol9pZSEWw5j/hHg5cdsMBoOowWHy+TxYJGw2G7J2iVKpRHZjDafTSbMmE4lEEEtzF5Cv24c+OEKxWESxaui6ztm5hKzIHP34TnNLM8rpX6LRKFoiipi6d8ts97RjGRpF0zQU1Uq5XMYoFmlsbOSkco7VakXLZogtxFA3Vy6gtrY29JEx7HY7kqzWNE8Of+NodSA3NCFZJIqrceLxOPU764jpsbBZXawbe1Bzr0KZTIbizjYdHe2cOVwIITj9OktiOYFUOEC8vTtoKopC/fhD3G43FkUjmUySTyUZGAgiXffUHnE8855UKoVe+oN4PX7TrC45hsfwer2oqlLTyMVjDA0NYbnRh1GpcPDxHRubmxwqFsSrOyFTli2oXUGcLieSEKTTGUrb3/B4PBjuLgzDwFyMsP9zn1//v/gP+vnm49So+cIAAAAASUVORK5CYII=',
  X:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAYAAABy6+R8AAAAAXNSR0IArs4c6QAAAgdJREFUKFNlz99rklEcx/H34/Po3Npsc84oZsOFNsQICjb64bAIci29WesmCLrp1+WgP6SboCCim2jpXbFZF4E2J8XoRsHACCmWrS1/zE3dM31O+Mi2RufmnM+B1/l8j3QveFG4tS0MBgOrZgutNVAtI0kSNdms57pi0HfTVo3q5ibSzPVJMVRbx+0+judyEIMk8eXdGzKZDOaBI0xNTaGaFNKpNJ9j79E0DenR5DkhC42Ojg4Gb96n32aj9i3L/Nw8I4EgbpeLgdVlwuEwB4t5vXEXtYK4EGR0dIyucoFkMonr0oT+WOXjBxKJBQ7VSm30ZOKM0E+t2R0uAoEAa3YHxWIBW6+Fer3On5fP+JXPI9P4H/08YGN83Efn6bMIITBKTXK5HIXZ5zQbjf1ISO2mqmzCarXiuvNAzz3bdeLxOEry7c4we007aNNgxOs9QXfoxi5KpdNszM0ihLYLpcdX9v603O8gFArB4UF9HM1kolwus/LiKaVSEXNTbTf9i5RT5/H5fKwZzWSzWYZHRpAVherrV6RTKTrFdhs9DPqEqalhNBrpnr6F0+nE8v0r0WgU79Vr2O121JUfRCIRhjd+70d9vX0cvTuDLCtsJOMsLiawnBzD7/fT06gSi8VQl+JtdHs6JI5trePxeLA7hvTLXHKBQqFAXVZ0pJq7qFQqxJY+oaoqfwF/ldogXLvF3wAAAABJRU5ErkJggg==',
  Y:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAYAAABy6+R8AAAAAXNSR0IArs4c6QAAAe9JREFUKFONks1vElEUxX8zyIikFCpg6lTFpiYFmQEbN9b4sTFdaYzutK3RvYkL49Lon+OmutHEdGvigqpNlBCx0BaCZRLlw7RlBjrMM8yAblx4Nyf3vpx7zr33SXeXrgs51kZRFOzDLQYhZNtFhOyC5ARc9DXjmKaJtPhoXpydvUgqlSIoxyl+K5Kvr+KTZa4kl1HVKbbaOfL5PI29r5iWhfTgyVUxMT5NJpPh1LEk25UKnyqvmYhEOH/yNqFQiA/lt5RKJbrSd4QjkO49zQqcMdLpNOfUm+zt7vJlM0csGuPMlI7ZMclVX2DU69hS27M7IqmqOuw8RrG6TjQWQw3PUC6XWd9ZodPZ/0tafJ4WspBR/AoXppdIJE5j/QK/otBTmu4sG41V+n0bIfqe0og0SLT4LZKzSSJHJpFlH5s/PlMoFDB673EcB3AQQiAtP9PFIBlELJBC1zPMRC65j7ntl+4CTGreCf5F8lsqmWwW7fgClmWxVnlFrVaj59v5QxouYk44UtctHrKj6LqONnnDHXytuoJRNziQDM+W5Bttb04Iuedd/ODo/5HuP74m7KDhKfXDaJqGdmKB/c4+H7feDJV+ek3tIHa/j3Tn4WVBuOF+G589TiKRIBGep9vtstF8R7vVwpabnq1egI7Z4Tda9u4XXikzmgAAAABJRU5ErkJggg==',
  G:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAYAAABy6+R8AAAAAXNSR0IArs4c6QAAAhhJREFUKFNtkb1PU2EUh5/3fvTjYmu1KgI10qJAm5bBQQihwU0TIw5OJiAO7DoYBhP5BxwcxYV/wInEBI0RIwmYEEONQ9Mi0aEUi4aKbRHa23tf41sJi2c4v+Qkz/n4HTF2Ky2N7u9Ylh/N9fM3TDukVApXacPzTalwDaq1KuLO1A3pdhRUMWidJpFIED2TxOfzYbsNdsplMuuvKZVKaJhIVyImHg5JodsYusG11H06OjppeLapVqtY5km8Xi979V8sLr5h21luTTyEujq7uJq8h6bprGZfkc/lOBU6x+joKB5LI5PJ8HHzeQsan0lIwzlOb28fIxfucnCwz8KnJ+yUd/CYFol4goAVZnOzyJet1SNIt4MkU0mGuieo7dV4sfaYSqUCGBi6jnB9SCmx9dIh1C91O0RqIMXg+XHlzsKHWRqNBgH9LEIIHLFPvV6nIjYULMZn/g9FYzEu9Y2ozq52QC6X4312/t+kRwPScNuI98cZ7plU671ce6os72kfJBKJEPCcIL+e593n2SNIb1rEYjGuxKdoNh3eZucoFAoEtahyrz0UIZfPsbTxrAVNTqel4/3JsUCAm5en8fstdsu7FItFTMNLNBrF0+aqFyytz6kbxcSDYSn9FYQmuBgYIz2SxhCG6giayo62x8ryCtnyfAu6ffu6NCI/MA2TpvGbcDhMd1cCy7JwHIdarcbXrax6gWkHlat/ADeT3iuAweiQAAAAAElFTkSuQmCC',
  H:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAYAAABy6+R8AAAAAXNSR0IArs4c6QAAAd9JREFUKFONkc9PE0EYht/Z7sJui2K3hTaEzlZqlV286UEQOZAYD148qUCriQknEi8eDfrvCAnGgxcvJCScVKxHYxu75UcXa2hJu7vYbumYnVWShotzmbk8837f85KFhfuMqE3IsoxuuA7/MKHD738n1JWDZ0uF67ggiyt32MClELR0GjNXHuHkxMXO3ltUqxZiCoVhGBhTdVRME1/2NnDcaIA8e3GX9WSvD/q0uwGraiEe1s5Btm2DPFm9wUIIg2oaZjJLQdLuO1QtCzGZYlKfxHhch1kuo7C/Dsd1AkgkQ6AaxfTEYh+kDqagG/p5KP96iom9OCjVMJtZQrvdxjfzIw4Pf2I4MoJsNgs1PgrT9JPewHZskNwrg0ls5AxSFAVdscFlCb3A2ikjKBa/c4iPl1u9ziRE+U6zE3lIkojjXhkdr4NBXIT/iSgoKJVK2DlYh8OT/kK+8tuXc3ynwo9Nbi8aSXJ7idEUV/55fw2un5R/eZOJQgSalsZ05nF/T3L6zF7Q01owng9JoQuglP4XxEU8fX6PCcO/edKtqw/gui4Klfe8p6gyDp33dA1mxcTX8ge0Wi2Qh8tzbCB2ikQyASMxD8/zUKxvoX50hCEpyfuLhVOo1Woo/tpGs9nEH+ua+1vGGVKcAAAAAElFTkSuQmCC'
};

const SCREEN_GENE_WIDTH = 0.007;
const SCREEN_GENE_HEIGHT = 0.012;
const SCREEN_GENE_X_POSITION_CENTER = 0.42;
const SCREEN_GENE_Y_POSITION_CENTER = 0.286;
const SCREEN_DISTANCE_BETWEEN_GENES = 0.01405;

const ASPECT_RATIO_169 = 16 / 9;

class ScreenCaptureService {
  listeners: ScreenCaptureServiceEventListenerCallback[] = [];

  animationFrameRef: number;
  video: HTMLVideoElement;
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

  private stopScanning() {
    this.listeners.forEach((listenerCallback) => {
      listenerCallback('STOPPED');
    });
    cancelAnimationFrame(this.animationFrameRef);
  }

  private scanFrame() {
    const geneScans = this.getSaplingGenesScans();

    const promises: Promise<{ key: string; rawMisMatchPercentage: number }>[] = [];
    geneScans.forEach((geneImgData) => {
      promises.push(this.getMostResemblingGene(geneImgData));
    });

    return Promise.all(promises)
      .then((results) => {
        const totalMismatchPercentage = results.reduce((acc, result) => acc + result.rawMisMatchPercentage, 0);
        if (totalMismatchPercentage < MIN_RESEMBLENCE_THRESHOLD) {
          const saplingGenesString = results.map((result) => result.key).join('');
          this.listeners.forEach((listenerCallback) => {
            listenerCallback('SAPLING-FOUND', saplingGenesString);
          });
        }
      })
      .catch(() => {
        // Fail silently. If there was an error it was not possible to find and match all genes from the screen capture.
      });
  }

  private getMostResemblingGene(imgData: string): Promise<{ key: string; rawMisMatchPercentage: number }> {
    const mainPromise = new Promise<{ key: string; rawMisMatchPercentage: number }>((mainResolve, mainReject) => {
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

      Promise.all(promises)
        .then((resultList) => {
          const mostResemblingGeneResult = resultList.sort((a, b) =>
            a.rawMisMatchPercentage > b.rawMisMatchPercentage ? 1 : -1
          )[0];
          mainResolve(mostResemblingGeneResult);
        })
        .catch(mainReject);
    });

    return mainPromise;
  }

  private getSaplingGenesScans(): string[] {
    const geneScans = [];
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
      for (let genePosition = 0; genePosition < 6; genePosition++) {
        const saplingGenesXPixelsStart = Math.round(
          this.videoCanvas.width *
            (SCREEN_GENE_X_POSITION_CENTER - SCREEN_GENE_WIDTH / 2 + SCREEN_DISTANCE_BETWEEN_GENES * genePosition)
        );
        const saplingGenesXPixelsWidth = Math.round(this.videoCanvas.width * SCREEN_GENE_WIDTH);
        const saplingGenesYPixelsStart = Math.round(
          this.videoCanvas.height * (SCREEN_GENE_Y_POSITION_CENTER - SCREEN_GENE_HEIGHT / 2)
        );
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

  addEventListener(callback: ScreenCaptureServiceEventListenerCallback) {
    this.listeners.push(callback);
  }
}

export default new ScreenCaptureService();
