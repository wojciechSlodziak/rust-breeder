<template>
  <span>
    <v-btn
      @click="isDialogOpen = true"
      :disabled="isDisabled"
      v-if="shouldDisplayScreenCaptureButton && !isScanning && !isInitializing"
    >
      Scan Rust
      <v-icon right>
        mdi-monitor-screenshot
      </v-icon>
    </v-btn>
    <v-btn
      class="white--text"
      @click="stopCapturing"
      v-if="isInitializing || isScanning"
      color="red"
      :disabled="isInitializing"
    >
      {{ isScanning ? 'Stop Scanning' : 'Initializing...' }}
      <v-progress-circular
        class="ml-2"
        indeterminate
        color="white"
        size="15"
        width="2"
        v-if="isScanning"
      ></v-progress-circular>
    </v-btn>
    <v-dialog v-model="isDialogOpen" width="600" overlay-opacity="0.75">
      <v-card>
        <v-card-title class="headline" primary-title>
          <h2 class="text-h5">How to Scan Rust for Saplings?</h2>
        </v-card-title>

        <v-card-text>
          <v-container>
            <ol>
              <li>
                <p>
                  For best results, use <strong>Chrome</strong>, <strong>Edge</strong> or <strong>Firefox</strong>.
                  Other browsers might not work correctly.
                </p>
              </li>
              <li>
                <p>
                  Make sure your <v-chip outlined>USER INTERFACE SCALE</v-chip> setting is set to
                  <v-chip outlined>1.0</v-chip> in Rust. Sometimes the slider shows 1.0, but the value could be at 0.97.
                  Run <v-chip outlined>graphics.uiscale</v-chip> command in the Rust console to see the actual value.
                </p>
              </li>
              <li>
                <p>
                  Make sure you run the game in <v-chip outlined>16:9</v-chip> aspect ratio resolution (1600x900,
                  1920x1080, 2560x1440 or 4K) and <strong>borderless</strong> mode. If you have a different resolution
                  on your monitor, set Rust to <strong>windowed</strong> mode and select a 16:9 ratio resolution.
                </p>
              </li>
              <li>
                <p>Click <strong>SCAN</strong> and select Rust window.</p>
              </li>
              <li>
                <p class="mb-0">
                  After the scanning begins, you need to display the genes on the screen by either:
                </p>
                <ul class="mb-3">
                  <li>clicking on a Sapling in your inventory or storage,</li>
                  <li>looking at a planted Sapling.</li>
                </ul>
                <p>
                  It takes about a second to capture each Sapling.
                </p>
              </li>
              <li><p class="mb-0">Enjoy! If it doesn't work, let me know on Discord!</p></li>
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

    <v-snackbar class="scanner_preview" v-model="isScanning" timeout="-1" right>
      <p class="text-center">
        Scanner Preview
        <v-icon right>
          mdi-monitor-screenshot
        </v-icon>
      </p>
      <div class="scanner_preview-region pa-2">
        <p class="mb-2">Inventory Region</p>
        <canvas ref="scannerPreview1"></canvas>
      </div>
      <div class="scanner_preview-region mt-4 pa-2">
        <p class="mb-2">Planted Region</p>
        <canvas ref="scannerPreview2"></canvas>
      </div>
    </v-snackbar>
  </span>
</template>

<script lang="ts">
import { PreviewData, ScreenCaptureServiceEventType } from '@/services/screen-capture/models';
import { Component, Vue, Prop } from 'vue-property-decorator';
import screenCaptureService from '../services/screen-capture/screen-capture.service';

@Component
export default class SaplingScreenCapture extends Vue {
  @Prop({ type: Boolean }) isDisabled: boolean;

  isDialogOpen = false;
  isScanning = false;
  isInitializing = false;
  shouldDisplayScreenCaptureButton = false;

  created() {
    this.shouldDisplayScreenCaptureButton = navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices;
  }

  mounted() {
    screenCaptureService.addEventListener(this.onScreenCaptureServiceEvent);
  }

  startCapturing() {
    screenCaptureService.startCapturing();
  }

  stopCapturing() {
    screenCaptureService.stopCapturing();
  }

  setPreview(regionIndex: number, imgData: ImageData) {
    const previewCanvas = this.$refs[`scannerPreview${regionIndex + 1}`] as HTMLCanvasElement;
    const previewCanvasCtx = previewCanvas.getContext('2d');
    if (previewCanvasCtx) {
      previewCanvas.width = imgData.width;
      previewCanvas.height = imgData.height;
      previewCanvasCtx.putImageData(imgData, 0, 0);
    }
  }

  onScreenCaptureServiceEvent(eventType: ScreenCaptureServiceEventType, data?: string | PreviewData) {
    if (eventType === 'INITIALIZING') {
      this.isInitializing = true;
    } else if (eventType === 'STARTED') {
      this.isInitializing = false;
      this.isScanning = true;
      this.$emit('started-scanning');
    } else if (eventType === 'STOPPED') {
      this.isInitializing = false;
      this.isScanning = false;
      this.$emit('stopped-scanning');
    } else if (eventType === 'SAPLING-FOUND') {
      this.$emit('sapling-scanned', data);
    } else if (eventType === 'PREVIEW') {
      this.setPreview((data as PreviewData).regionIndex, (data as PreviewData).imgData);
    }
  }
}
</script>

<style scoped lang="scss">
.scanner_preview {
  .v-snack__action {
    display: none;
  }
  .scanner_preview-region {
    border: 2px solid black;
  }
  canvas {
    width: 100%;
    display: block;
  }
}
</style>

<style lang="scss">
.scanner_preview {
  .v-snack__action {
    display: none;
  }
}
</style>
