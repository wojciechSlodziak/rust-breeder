<template>
  <div class="previous-genes mb-7">
    <div class="text-center my-6" v-if="storedSets.length === 0">You don't have any saved gene sets.</div>
    <ul class="pl-0">
      <li v-for="(storedSet, index) in storedSetsDetailed" :key="index">
        <v-card
          class="previous-genes_card d-flex align-center justify-space-between"
          v-ripple
          @click="handleSetSelect(index)"
          @keyup.enter="handleSetSelect(index)"
        >
          <img class="mx-2" :src="`/img/${storedSet.imgName}.webp`" />
          <span class="px-2 previous-genes_count">Genes: {{ storedSet.saplingsCount }}</span>
          <span>{{ storedSet.dateString }}</span>
          <v-btn class="mx-1" icon @click="handleRemoveSetClick($event, index)">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import StoredSet from '@/interfaces/stored-set';
import { Component, Prop, Vue } from 'vue-property-decorator';

const GENE_SETS_KEY = 'PREVIOUS_GENE_SETS';
const MAX_STORED_SETS = 200;

@Component
export default class PreviousGenes extends Vue {
  @Prop({ type: String }) readonly selectedPlantTypeName: string;
  storedSets: StoredSet[] = [];

  get storedSetsDetailed() {
    return this.storedSets.map((set) => ({
      ...set,
      saplingsCount: set.genes.split('\n').length,
      dateString: new Date(set.timestamp).toLocaleString(),
      imgName: set.selectedPlantTypeName || 'mixed-berry'
    }));
  }

  constructor() {
    super();
    window.addEventListener('storage', () => {
      this.loadStoredSets();
    });
  }

  mounted() {
    this.loadStoredSets();
  }

  loadStoredSets() {
    const storedSetsJSON = localStorage.getItem(GENE_SETS_KEY);
    if (storedSetsJSON) {
      this.storedSets = JSON.parse(storedSetsJSON);
    }
  }

  storeSets() {
    localStorage.setItem(GENE_SETS_KEY, JSON.stringify(this.storedSets));
  }

  addNewSet(genes: string) {
    this.loadStoredSets();
    if (
      !this.storedSets.find((set) => set.genes === genes && set.selectedPlantTypeName === this.selectedPlantTypeName)
    ) {
      const newSet: StoredSet = {
        timestamp: Date.now(),
        selectedPlantTypeName: this.selectedPlantTypeName,
        genes
      };
      this.storedSets = [newSet, ...this.storedSets];
      if (this.storedSets.length > MAX_STORED_SETS) {
        this.storedSets.pop();
      }
      this.storeSets();
      return true;
    }
    return false;
  }

  handleSetSelect(index: number) {
    this.$emit('genes-selected', this.storedSets[index]);
  }

  handleRemoveSetClick(event: Event, index: number) {
    event.stopPropagation();
    this.storedSets.splice(index, 1);
    this.storeSets();
  }
}
</script>

<style scoped lang="scss">
.previous-genes {
  border: 1px solid rgba(255, 255, 255, 0.24);
  ul {
    list-style-type: none;
    overflow-y: auto;
    max-height: 400px;
    &::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }
    &::-webkit-scrollbar-button {
      width: 0px;
      height: 0px;
    }
    &::-webkit-scrollbar-thumb {
      background: #9b9b9b;
      border: 0px none #ffffff;
    }
    &::-webkit-scrollbar-thumb:hover {
      background: #8a8a8a;
    }
    &::-webkit-scrollbar-thumb:active {
      background: #5f5f5f;
    }
    &::-webkit-scrollbar-track {
      background: #3b3b3b;
      border: 0px none #ffffff;
    }
    &::-webkit-scrollbar-corner {
      background: transparent;
    }
    li {
      font-size: 0.875rem;
      user-select: none;
      .previous-genes_card {
        margin: 5px;
        .previous-genes_count {
          white-space: nowrap;
          min-width: 100px;
        }
      }
      img {
        max-height: 30px;
      }
    }
  }
}

.theme--light {
  .previous-genes {
    border: 1px solid rgba(0, 0, 0, 0.38);

    ul {
      &::-webkit-scrollbar-thumb {
        background: #aeaeae;
      }
      &::-webkit-scrollbar-thumb:hover {
        background: #9b9b9b;
      }
      &::-webkit-scrollbar-thumb:active {
        background: #787878;
      }
      &::-webkit-scrollbar-track {
        background: #ededed;
      }
    }
  }
}
</style>
