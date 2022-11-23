<template>
  <div class="sapling-detailed">
    <span class="sapling-detailed_sapling-detail" :class="{ 'sapling-detailed_sapling-detail--subtle': subtleDetails }">
      <template v-if="sapling.index !== undefined">#{{ sapling.index + 1 }}</template>
      <template v-if="sapling.index === undefined">{{ 'GEN.' + sapling.generationIndex }}</template>
    </span>
    <SaplingGeneRepresentation
      class="sapling-detailed_sapling"
      :class="{
        'sapling-detailed_sapling--selectable': selectable && sapling && sapling.generationIndex > 0
      }"
      :sapling="sapling"
      @click.native="selectable && sapling.generationIndex > 0 && handleSaplingClick()"
    />
    <span
      class="sapling-detailed_sapling-chance"
      :class="{
        'sapling-detailed_sapling-chance--subtle': subtleDetails,
        'sapling-detailed_sapling-chance--moderate': saplingVariants ? saplingVariants.mapList[0].chance <= 0.5 : false
      }"
      >{{
        sapling.generationIndex > 0 && saplingVariants ? Math.round(saplingVariants.mapList[0].chance * 100) + '%' : ''
      }}</span
    >
  </div>
</template>
<script lang="ts">
import Sapling from '@/models/sapling.model';
import { GeneticsMapGroup } from '@/services/optimizer-service/models';
import { Component, Vue, Prop } from 'vue-property-decorator';
import SaplingGeneRepresentation from './SaplingGeneRepresentation.vue';

@Component({
  components: { SaplingGeneRepresentation }
})
export default class SimulationMap extends Vue {
  @Prop({ type: Object, required: true }) readonly sapling!: Sapling;
  @Prop({ type: Object }) readonly saplingVariants?: GeneticsMapGroup;
  @Prop({ type: Boolean }) readonly subtleDetails: boolean;
  @Prop({ type: Boolean }) readonly selectable: boolean;

  handleSaplingClick() {
    this.$emit('click');
  }
}
</script>

<style scoped lang="scss">
.sapling-detailed {
  position: relative;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  padding: 5px 0;
}

.sapling-detailed_sapling {
  font-size: 1rem;
  outline: 0px solid rgba(223, 145, 0, 0.3);
}
.sapling-detailed_sapling--selectable {
  transition: outline-color 0.15s;
  user-select: none;
  outline: 2px solid rgba(223, 145, 0, 0.4);
  outline-offset: 2px;
}
.sapling-detailed_sapling--selectable:hover {
  outline: 2px solid rgba(223, 145, 0, 0.8);
  cursor: pointer;
}
.sapling-detailed_sapling--selectable:active {
  outline: 2px solid rgb(223, 145, 1);
}

.sapling-detailed_sapling-detail,
.sapling-detailed_sapling-chance {
  font-size: 0.75em;
  user-select: none;
  flex: 1;
}
.sapling-detailed_sapling-detail {
  text-align: right;
  margin-right: 8px;
}
.sapling-detailed_sapling-chance {
  text-align: left;
  margin-left: 8px;
  &.sapling-detailed_sapling-chance--moderate {
    color: rgb(223, 145, 0);
  }
}
.sapling-detailed_sapling-detail--subtle,
.sapling-detailed_sapling-chance--subtle {
  opacity: 0.75;
}
</style>
