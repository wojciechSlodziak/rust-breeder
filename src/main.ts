import Vue from 'vue';
import App from './App.vue';
import Worker from 'worker-loader!./worker';

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App)
}).$mount('#app');

const worker = new Worker();
worker.postMessage({ a: 1 });
worker.addEventListener('message', function(event) {
  console.log('in parent', event);
});
