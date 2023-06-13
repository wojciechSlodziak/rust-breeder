<template>
  <div class="d-flex justify-center mx-3">
    <a class="d-block" href="https://pinehosting.com/clientarea/aff.php?aff=298" target="_blank" title="Pine Hosting"
      ><img src="/img/pine-hosting-ad.webp"
    /></a>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({})
export default class PineHostingAd extends Vue {}
</script>

<style scoped lang="scss">
a {
  max-width: min(100%, 500px);
}
img {
  max-width: 100%;
}
</style>
