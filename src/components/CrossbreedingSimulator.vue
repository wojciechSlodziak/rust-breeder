<template>
  <div><textarea v-model="saplingGenes" /></div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class CrossbreedingSimulator extends Vue {
  data() {
    return {
      saplingGenes: 'abc'
    };
  }
}
</script>

<style scoped lang="scss"></style>
