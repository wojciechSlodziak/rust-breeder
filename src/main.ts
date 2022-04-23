import 'reflect-metadata';
import Vue from 'vue';
import App from './App.vue';
import vuetify from './plugins/vuetify';

Vue.config.productionTip = false;

// new Vue({
//   vuetify,
//   render: (h: Function) => h(App)
// }).$mount('#app');


// TODO: rework this temp code into something good :)

// Sapling we want to achieve, to be chosen from 3 possibilities.
const targetSapling = 'GGYYYY';

// User provided source saplings
const sourceGenes = `GHXYGG
YHYXGX
HYXGGX
HHGYXX
GYHYXX`;

// TODO: 
// build them into Saplings
// score based on resultSapling and on coverage of genes in sourceSaplings
// sort by score
// perform crossbreeding on limited set (start with 3 saplings taken from the sorted by score list)
// if found something better then source saplings, add to another list firstStepResultSaplings
// after crossbreeding for limited set is done, perform crossbreeding with all saplings from firstStepResultSaplings and that set
// if found perfect show it in the ui
// increase the limited set size by 1 (add next best sapling from the list, make sure to not crossbreed the same combinations again)


