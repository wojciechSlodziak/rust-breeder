<template>
  <div class="ads mx-3 pb-3">
    <div class="d-flex justify-center mt-3">
      <!-- PineHosting Ad -->
      <a class="d-block" href="https://pinehosting.com/clientarea/aff.php?aff=298" target="_blank" title="Pine Hosting"
        ><img src="/img/pine-hosting-ad.webp"
      /></a>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component({})
export default class Ads extends Vue {
  @Prop({ type: Boolean }) readonly advertisementCookiesAccepted: boolean;
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
