<template>
  <div></div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class InViewAnchor extends Vue {
  created() {
    window.addEventListener('scroll', this.checkIfInView);
    window.addEventListener('resize', this.checkIfInView);
  }

  mounted() {
    this.onNextTickRerender(() => {
      this.checkIfInView();
    });
  }

  checkIfInView() {
    const rect = this.$el.getBoundingClientRect();
    const isInView =
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth);
    if (isInView) {
      window.removeEventListener('scroll', this.checkIfInView);
      window.removeEventListener('resize', this.checkIfInView);
      this.$emit('in-view');
    }
  }
}
</script>
