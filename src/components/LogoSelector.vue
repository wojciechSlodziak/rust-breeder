<template>
  <div
    class="logo__container d-flex align-center"
    :class="{
      'logo__container--expanded': isExpanded,
      'logo__container--animate-in': animateIn
    }"
  >
    <div class="logo__image-container d-flex align-center">
      <v-tooltip
        v-for="imageName in displayedImageNames"
        :key="imageName"
        open-delay="400"
        z-index="1001"
        max-width="600"
        :open-on-focus="false"
        :disabled="isExpanded || $vuetify.breakpoint.xsOnly"
        bottom
      >
        <template v-slot:activator="{ on, attrs }">
          <button
            :disabled="$vuetify.breakpoint.xsOnly"
            v-bind="attrs"
            v-on="on"
            :class="{
              'logo__image--active': activeImageName === imageName,
              'logo__image--hidden': activeImageName !== imageName && !isExpanded
            }"
            @click="!$vuetify.breakpoint.xsOnly && handleImageClick(imageName)"
          >
            <img :src="`/img/${imageName}.png`" :ref="imageName" />
          </button>
        </template>
        <span
          >Select a type of plant to keep track of what you are crossbreeding. Selection
          <strong>does not</strong> impact the results of the calculation.</span
        >
      </v-tooltip>
    </div>
    <v-toolbar-title class="ml-3 overflow-visible">
      <a href="/" title="RustBreeder">
        RustBreeder
      </a>
    </v-toolbar-title>
  </div>
</template>

<script lang="ts">
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
    'corn'
  ];
  activeImageName = this.imagesNames[0];
  isExpanded = false;
  animateIn = false;

  get displayedImageNames() {
    return this.activeImageName !== this.imagesNames[0] || this.isExpanded
      ? this.imagesNames.slice(1)
      : this.imagesNames;
  }

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
  }

  private animateLogo() {
    this.onNextTickRerender(() => {
      this.animateIn = true;
      setTimeout(() => {
        this.animateIn = false;
      }, 800);
    });
  }

  handleImageClick(imageName: string) {
    if (this.isExpanded) {
      this.activeImageName = imageName;
      this.setImageAsFavicon(imageName);
      this.isExpanded = false;
    } else {
      this.isExpanded = true;
    }
  }

  private setImageAsFavicon(imageName: string) {
    const link = document.querySelector("link[rel~='icon']") as HTMLAnchorElement;
    if (link) {
      link.href = `/img/${imageName}.png`;
    }
  }
}
</script>

<style scoped lang="scss">
.logo__container {
  height: 100%;
  padding: 2px 0;
  margin-left: -5px;
  .v-toolbar__title {
    opacity: 1;
    transform: scale(1);
    transition: transform 0.2s ease 0.2s, opacity 0.2s ease 0.2s, visibility 0s linear 0.15s, width 0s linear 0.15s;
    a {
      color: inherit;
      text-decoration: inherit;
    }
  }
  .logo__image-container {
    height: 100%;
    border-radius: 5px;
    background-color: rgba(0, 0, 0, 0.15);
    button {
      margin: 0 4px;
      padding: 3px 0;
      display: inline-block;
      height: 100%;
      border: 0px;
      background: transparent;
      max-width: 46px;
      transition: all 0.15s ease;
      &.logo__image--hidden {
        visibility: hidden;
        max-width: 0;
        opacity: 0;
        margin: 0;
      }
      img {
        max-height: 100%;
      }
      &:not([disabled]):hover {
        transform: scale(1.15);
      }
      &:focus {
        outline: 2px solid var(--v-primary-base);
      }
    }
  }
  &.logo__container--animate-in {
    .logo__image-container {
      button:first-child:not(:hover) {
        animation: heartbeat 0.5s 0.3s ease both;
      }
    }
  }
  &.logo__container--expanded {
    .v-toolbar__title {
      transition: opacity 0s, visibility 0s, width 0s;
      opacity: 0;
      width: 0;
      transform: scale(0.9);
      visibility: hidden;
    }

    .logo__image-container {
      background-color: rgba(0, 0, 0, 0.25);
    }
  }
}

.theme--light {
  .logo__container {
    .logo__image-container {
      background-color: rgba(0, 0, 0, 0.1);
    }
    &.logo__container--expanded {
      .logo__image-container {
        background-color: rgba(0, 0, 0, 0.1);
      }
    }
  }
}

@keyframes heartbeat {
  0%,
  50%,
  100% {
    transform: scale(1);
  }
  25%,
  75% {
    transform: scale(1.15);
  }
}
</style>
