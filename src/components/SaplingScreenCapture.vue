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
                  For best results use Chrome or Edge. Other browsers might now work correctly.
                </p>
              </li>
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
import screenCaptureService from '../services/screen-capture/screen-capture.service';

@Component
export default class SaplingScreenCapture extends Vue {
  isDialogOpen = false;
  isScanning = false;

  mounted() {
    screenCaptureService.addEventListener(this.onScreenCaptureServiceEvent);
  }

  startCapturing() {
    screenCaptureService.startCapturing();
  }

  stopCapturing() {
    screenCaptureService.stopCapturing();
  }

  onScreenCaptureServiceEvent(eventType: string, data?: string) {
    if (eventType === 'STARTED') {
      this.isScanning = true;
      this.$emit('started-scanning');
    } else if (eventType === 'STOPPED') {
      this.isScanning = false;
      this.$emit('stopped-scanning');
    } else if (eventType === 'SAPLING-FOUND') {
      this.$emit('sapling-scanned', data);
    }
  }
}
</script>