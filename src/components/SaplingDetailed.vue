<template>
  <div class="sapling-detailed">
    <div class="sapling-detailed_annotation-left">
      <span
        class="sapling-detailed_annotation-sapling-metadata"
        :class="{ 'sapling-detailed_annotation-sapling-metadata--subtle': subtleDetails }"
      >
        <template v-if="sapling.index !== undefined">#{{ sapling.index + 1 }}</template>
        <template v-if="sapling.index === undefined">{{ 'GEN.' + sapling.generationIndex }}</template>
      </span>
    </div>
    <SaplingGeneRepresentation
      class="sapling-detailed_sapling"
      :class="{
        'sapling-detailed_sapling--selectable': selectable && sapling && sapling.generationIndex > 0
      }"
      :sapling="sapling"
      @click.native="selectable && sapling.generationIndex > 0 && handleSaplingClick()"
    />
    <div class="sapling-detailed_annotation-right">
      <span
        v-if="!(showGeographicalDirectionTipEast || showGeographicalDirectionTipWest)"
        class="sapling-detailed_annotation-sapling-chance"
        :class="{
          'sapling-detailed_annotation-sapling-chance--subtle': subtleDetails,
          'sapling-detailed_annotation-sapling-chance--moderate': saplingVariants
            ? saplingVariants.mapList[0].chance <= 0.5
            : false
        }"
        >{{
          sapling.generationIndex > 0 && saplingVariants
            ? Math.round(saplingVariants.mapList[0].chance * 100) + '%'
            : ''
        }}</span
      >
      <div
        class="sapling-detailed_annotation-sapling-geo-direction"
        v-if="showGeographicalDirectionTipEast || showGeographicalDirectionTipWest"
      >
        <span class="sapling-detailed_annotation-sapling-geo-direction-west" v-if="showGeographicalDirectionTipWest"
          >W</span
        >
        <v-icon size="large">
          mdi-compass-rose
        </v-icon>
        <span class="sapling-detailed_annotation-sapling-geo-direction-east" v-if="showGeographicalDirectionTipEast"
          >E</span
        >
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Sapling from '@/models/sapling.model';
import { GeneticsMapGroup } from '@/services/crossbreeding-service/models';
import { Component, Vue, Prop } from 'vue-property-decorator';
import SaplingGeneRepresentation from './SaplingGeneRepresentation.vue';

@Component({
  components: { SaplingGeneRepresentation }
})
export default class SaplingDetailed extends Vue {
  @Prop({ type: Object, required: true }) readonly sapling!: Sapling;
  @Prop({ type: Object }) readonly saplingVariants?: GeneticsMapGroup;
  @Prop({ type: Boolean }) readonly subtleDetails: boolean;
  @Prop({ type: Boolean }) readonly selectable: boolean;
  @Prop({ type: Boolean }) readonly showGeographicalDirectionTipEast: boolean;
  @Prop({ type: Boolean }) readonly showGeographicalDirectionTipWest: boolean;

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
.sapling-detailed_annotation-left,
.sapling-detailed_annotation-right {
  font-size: 0.75em;
  user-select: none;
  flex: 1;
}
.sapling-detailed_annotation-left {
  text-align: right;
  padding-right: 8px;
}
.sapling-detailed_annotation-right {
  text-align: left;
  padding-left: 8px;
}
.sapling-detailed_annotation-sapling-geo-direction {
  position: relative;
  padding-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  i {
    opacity: 0.15;
  }
}
.sapling-detailed_annotation-sapling-chance--moderate {
  color: $c-color-dark-orange;
}
.sapling-detailed_annotation-sapling-metadata--subtle,
.sapling-detailed_annotation-sapling-chance--subtle {
  opacity: 0.75;
}
.theme--light {
  .sapling-detailed_annotation-sapling-geo-direction {
    i {
      opacity: 0.75;
    }
  }
}
</style>
