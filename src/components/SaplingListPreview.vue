<template>
  <div class="sapling-list-preview">
    <ul>
      <li v-for="(sapling, index) in saplingList" :key="index">
        <SaplingGeneRepresentation
          class="sapling-list-preview_sapling"
          :sapling="sapling"
          :highlight-errors="highlightErrors"
        />
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import Sapling from '@/models/sapling.model';
import { Component, Vue, Prop } from 'vue-property-decorator';
import SaplingGeneRepresentation from './SaplingGeneRepresentation.vue';
import goTo from 'vuetify/lib/services/goto';

@Component({
  components: { SaplingGeneRepresentation }
})
export default class SaplingListPreview extends Vue {
  @Prop({ type: Array, required: true }) readonly saplingGeneList!: string[];
  @Prop({ type: Boolean, default: false }) readonly highlightErrors: boolean;

  get saplingList() {
    return this.saplingGeneList.map((genes) => new Sapling(genes));
  }

  animateAndScrollToLastSapling() {
    this.$nextTick(() => {
      const lastSaplingGeneRepresentationElement = this.$el.querySelector(
        'li:last-child .sapling-list-preview_sapling'
      );
      lastSaplingGeneRepresentationElement?.classList.add('sapling-list-preview_sapling--animate');
      setTimeout(() => {
        lastSaplingGeneRepresentationElement?.classList.remove('sapling-list-preview_sapling--animate');
      }, 400);

      if (lastSaplingGeneRepresentationElement) {
        const rect = lastSaplingGeneRepresentationElement.getBoundingClientRect();
        const isInView =
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.right <= (window.innerWidth || document.documentElement.clientWidth);
        if (!isInView) {
          const topDistanceToCenterize =
            rect.top + window.scrollY - (window.innerHeight || document.documentElement.clientHeight) / 2;
          goTo(topDistanceToCenterize, { duration: 100 });
        }
      }
    });
  }
}
</script>

<style scoped lang="scss">
.sapling-list-preview {
  margin-top: 9px;
  font-size: 0.72rem;
  position: absolute;
  top: 0px;
  right: 7px;
}
ul {
  list-style: none;
  margin: 0;
  padding: 0;
  li {
    padding: 5px 0;
  }
}
.sapling-list-preview_sapling--animate {
  animation: sapling-animation 0.4s ease-in;
}
@keyframes sapling-animation {
  0% {
    transform: scale(1.2);
    opacity: 0;
  }
  70% {
    opacity: 1;
    transform: scale(0.9);
  }
  85% {
    transform: scale(1.1);
  }
  100% {
  }
}
</style>
