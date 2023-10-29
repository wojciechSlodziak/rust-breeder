<template>
  <div class="ads mx-3 pb-3">
    <!-- AdSense - Block1 -->
    <div class="">
      <ins
        class="adsbygoogle"
        style="display:block"
        data-ad-client="ca-pub-2474292381535177"
        data-ad-slot="6288810864"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
    <div class="d-flex justify-center mt-3">
      <!-- PineHosting Ad -->
      <a class="d-block" href="https://pinehosting.com/clientarea/aff.php?aff=298" target="_blank" title="Pine Hosting"
        ><img src="/img/pine-hosting-ad.webp"
      /></a>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({})
export default class Ads extends Vue {
  mounted() {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  }
}
</script>

<style scoped lang="scss">
.ads {
  overflow: hidden;
}
a {
  max-width: min(100%, 500px);
}
img {
  max-width: 100%;
}
</style>
