<template>
  <v-snackbar class="scanner_preview" v-model="isOpen" timeout="-1" right max-width="350">
    <p class="text-center">
      Scanner Preview
      <v-icon right>
        mdi-monitor-screenshot
      </v-icon>
    </p>
    <div class="scanner_preview-region pa-2">
      <p class="mb-3">
        Inventory Region
        <v-tooltip top open-delay="400" z-index="1001" max-width="600">
          <template v-slot:activator="{ on, attrs }">
            <v-icon class="float-end" v-bind="attrs" text v-on="on">
              mdi-information-outline
            </v-icon>
          </template>
          <span
            >Displays the scanned region from Rust, which should contain the genes of the Sapling from your
            inventory/box. Genes should fit nicely in the preview or the scanner will not be able to recognize them. If
            they don't, you should review your Rust settings.
          </span>
        </v-tooltip>
      </p>
      <canvas ref="scannerPreview1"></canvas>
    </div>
    <div class="scanner_preview-region mt-4 pa-2">
      <p class="mb-3">
        Planter Region
        <v-tooltip top open-delay="400" z-index="1001" max-width="600">
          <template v-slot:activator="{ on, attrs }">
            <v-icon class="float-end" v-bind="attrs" text v-on="on">
              mdi-information-outline
            </v-icon>
          </template>
          <span
            >Displays the scanned region from Rust, which should contain the genes of the Sapling in the planter that
            you are looking at. Genes should fit nicely in the preview or the scanner will not be able to recognize
            them. If they don't, you should review your Rust settings.
          </span>
        </v-tooltip>
      </p>
      <canvas ref="scannerPreview2"></canvas>
    </div>
  </v-snackbar>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class SaplingScreenCapturePreview extends Vue {
  @Prop({ type: Boolean }) isOpen: boolean;

  setPreview(regionIndex: number, imgData: ImageData) {
    const previewCanvas = this.$refs[`scannerPreview${regionIndex + 1}`] as HTMLCanvasElement;
    const previewCanvasCtx = previewCanvas.getContext('2d');
    if (previewCanvasCtx) {
      previewCanvas.width = imgData.width;
      previewCanvas.height = imgData.height;
      previewCanvasCtx.putImageData(imgData, 0, 0);
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
