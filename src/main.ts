import 'reflect-metadata';
import Vue from 'vue';
import App from './App.vue';
import vuetify from './plugins/vuetify';

Vue.config.productionTip = false;

new Vue({
  vuetify,
  render: (h: Function) => h(App)
}).$mount('#app');
