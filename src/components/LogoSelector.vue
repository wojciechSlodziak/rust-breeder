<template>
  <div
    class="logo_container d-flex align-center"
    :class="{
      'logo_container--expanded': isExpanded,
      'logo_container--animate-in': animateIn && !$vuetify.breakpoint.xsOnly,
      'logo_container--animate-heartbeat': animateHeartbeat
    }"
  >
    <v-tooltip
      open-delay="400"
      z-index="1001"
      max-width="600"
      :open-on-focus="false"
      :disabled="isExpanded || $vuetify.breakpoint.xsOnly"
      bottom
    >
      <template v-slot:activator="{ on, attrs }">
        <div ref="logoSelector" class="logo_image-container d-flex align-center" v-bind="attrs" v-on="on">
          <button
            v-for="(imageName, index) in imagesNames"
            :key="imageName"
            class="logo_image-button"
            :data-index="index"
            :class="{
              'logo_image-button--hidden': activeImageName !== imageName && !isExpanded
            }"
            @click="handleImageClick(imageName)"
          >
            <img
              v-if="(index === 0 && !isExpanded && !isClosing) || index > 0"
              :src="`/img/${imageName}.webp`"
              :ref="imageName"
            />
            <v-icon v-else large>
              mdi-chevron-right
            </v-icon>
          </button>
        </div>
      </template>
      <span
        >Select a type of plant to keep track of what you are crossbreeding. Selection <strong>does not</strong> impact
        the results of the calculation.</span
      >
    </v-tooltip>
    <v-toolbar-title class="logo-selector_title overflow-visible">
      <a href="/" title="RustBreeder">
        <h1 class="text-h6">RustBreeder</h1>
      </a>
    </v-toolbar-title>
  </div>
</template>

<script lang="ts">
import eventBus, { GLOBAL_EVENT_SELECTED_PLANT_TYPE_CHANGED } from '@/lib/global-event-bus';
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class LogoSelector extends Vue {
  imagesNames = [
    'mixed-berry',
    'red-berry',
    'blue-berry',
    'yellow-berry',
    'green-berry',
    'white-berry',
    'hemp',
    'potato',
    'pumpkin',
    'corn',
    'wheat',
    'sunflower',
    'rose',
    'orchid'
  ];
  activeImageName = this.imagesNames[0];
  isExpanded = false;
  animateIn = false;
  isClosing = false;
  animateHeartbeat = false;

  mounted() {
    if (document.hidden) {
      const functionRef = () => {
        this.animateLogo();
        document.removeEventListener('visibilitychange', functionRef);
      };
      document.addEventListener('visibilitychange', functionRef);
    } else {
      this.animateLogo();
    }

    eventBus.$on(GLOBAL_EVENT_SELECTED_PLANT_TYPE_CHANGED, this.selectPlant);
  }

  get isPlantSelected() {
    return this.activeImageName !== this.imagesNames[0];
  }

  private animateLogo() {
    this.onNextTickRerender(() => {
      this.animateIn = true;
      setTimeout(() => {
        this.animateIn = false;
        this.animateHeartbeat = true;
        setTimeout(() => {
          this.animateHeartbeat = false;
        }, 1050);
      }, 800);
    });
  }

  handleImageClick(imageName: string) {
    if (this.isExpanded) {
      this.selectPlant(imageName);
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isExpanded = true;
    document.addEventListener('mousedown', this.onDocumentClick);
  }

  close() {
    this.isExpanded = false;
    this.isClosing = true;
    setTimeout(() => {
      this.isClosing = false;
    }, 250);
    document.removeEventListener('mousedown', this.onDocumentClick);
  }

  onDocumentClick(event: MouseEvent) {
    if (!event.composedPath().includes(this.$refs.logoSelector as HTMLElement)) {
      this.close();
    }
  }

  selectPlant(selectedPlantTypeName: string) {
    const imageName = selectedPlantTypeName || this.imagesNames[0];
    this.activeImageName = imageName;
    this.setImageAsFavicon(imageName);
    this.$emit('plant-type-change', selectedPlantTypeName);
  }

  private setImageAsFavicon(imageName: string) {
    const link = document.querySelector("link[rel~='icon']") as HTMLAnchorElement;
    if (link) {
      link.href = `/img/${imageName}.webp`;
    }
  }
}
</script>

<style scoped lang="scss">
.logo_container {
  --logo-container-background-color: rgba(0, 0, 0, 0.25);
  --logo-container-expanded-background-color: var(--logo-container-background-color);
  --button-size-px: 48px;
  --img-size-px: 40px;
  --app-title-margin-left: 10px;
  @media (min-width: 960px) {
    --button-size-px: 52px;
    --img-size-px: 44px;
  }
  user-select: none;
  height: 100%;
  padding: 2px 0;
  margin-left: -5px;
  .logo-selector_title {
    margin-left: var(--app-title-margin-left);
    opacity: 1;
    transform: scale(1);
    transition: transform 0.2s ease 0.2s, opacity 0.2s ease 0.2s, visibility 0s linear 0.15s, width 0s linear 0.15s;
    a {
      color: inherit;
      text-decoration: inherit;
    }
  }
  .logo_image-container {
    min-width: var(--button-size-px);
    border-radius: 5px;
    background-color: rgba(0, 0, 0, 0.15);
    .logo_image-button {
      border-radius: inherit;
      display: flex;
      justify-content: center;
      align-items: center;
      border: 0px;
      background: transparent;
      width: var(--button-size-px);
      height: var(--button-size-px);
      transition: all 0.25s ease;

      &.logo_image-button--hidden {
        visibility: hidden;
        width: 0;
        opacity: 0;
      }
      img {
        height: var(--img-size-px);
        width: var(--img-size-px);
        transition: transform 0.15s;
      }
      &:not([disabled]):hover {
        img {
          transform: scale(1.25);
        }
      }
      &:focus {
        outline: 2px solid var(--v-primary-base);
      }
    }
  }
  &.logo_container--animate-heartbeat:not(.logo_container--expanded) {
    .logo_image-container {
      animation: heartbeat 0.65s 0.4s ease both;
    }
  }
  &.logo_container--animate-in {
    .logo_image-container {
      .logo_image-button {
        visibility: visible;
        width: var(--button-size-px);
        opacity: 1;
      }
    }
  }
}

@media (min-width: 695px) {
  .logo_container {
    &.logo_container--expanded,
    &.logo_container--animate-in {
      .logo-selector_title {
        transition: opacity 0s, visibility 0s, width 0s;
        opacity: 0;
        width: 0;
        transform: scale(0.9);
        visibility: hidden;
      }

      .logo_image-container {
        background-color: var(--logo-container-expanded-background-color);
      }
    }
  }
}

@media (max-width: 694.98px) {
  .logo_container {
    --logo-container-expanded-background-color: rgba(0, 0, 0, 0.9);
    min-width: var(--button-size-px);
    position: relative;
    .logo_image-container {
      flex-direction: column;
      flex-wrap: wrap;
      position: absolute;
      top: 0;
      left: 0;
      max-height: calc(100dvh - 8px);
      z-index: 1;
    }
    .logo_image-button {
      &.logo_image-button--hidden {
        width: var(--button-size-px);
        height: 0;
      }
    }
    .logo-selector_title {
      margin-left: calc(var(--app-title-margin-left) + var(--button-size-px));
    }
    .logo_image-button[data-index='0'] i {
      rotate: 90deg;
    }
    &.logo_container--expanded {
      .logo_image-container {
        background-color: var(--logo-container-expanded-background-color);
      }
    }
  }
}

.theme--light {
  .logo_container {
    --logo-container-background-color: rgba(0, 0, 0, 0.1);
  }
  @media (max-width: 695px) {
    .logo_container {
      --logo-container-expanded-background-color: rgba(200, 200, 200, 0.75);
    }
  }
}

@keyframes heartbeat {
  0%,
  33%,
  66%,
  100% {
    transform: scale(1);
  }
  17%,
  50%,
  83% {
    transform: scale(1.15);
  }
}
</style>
