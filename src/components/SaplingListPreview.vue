<template>
  <div class="sapling-list-preview">
    <ul>
      <li v-for="(sapling, index) in saplingList" :key="index">
        <SaplingGeneRepresentation class="sapling-list-preview_sapling" :sapling="sapling" />
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import Sapling from '@/models/sapling.model';
import { Component, Vue, Prop } from 'vue-property-decorator';
import SaplingGeneRepresentation from './SaplingGeneRepresentation.vue';

@Component({
  components: { SaplingGeneRepresentation }
})
export default class SaplingListPreview extends Vue {
  @Prop({ type: Array, required: true }) readonly saplingGeneList!: string[];

  get saplingList() {
    return this.saplingGeneList.map((genes) => new Sapling(genes));
  }

  animateLastSapling() {
    this.onNextTickRerender(() => {
      const lastSaplingGeneRepresentationElement = this.$el.querySelector(
        'li:last-child .sapling-list-preview_sapling'
      );
      lastSaplingGeneRepresentationElement?.classList.add('sapling-list-preview_sapling--animate');
      setTimeout(() => {
        lastSaplingGeneRepresentationElement?.classList.remove('sapling-list-preview_sapling--animate');
      }, 400);
    });
  }
}
</script>

<style scoped lang="scss">
.sapling-list-preview {
  padding-top: 9px;
  font-size: 0.72rem;
  position: absolute;
  top: 0px;
  right: 10px;
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
4
