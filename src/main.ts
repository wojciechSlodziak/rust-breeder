import Vue from 'vue';
import App from './App.vue';
import * as workerPath from 'file-loader?name=[name].js!./worker';

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App)
}).$mount('#app');

const worker = new Worker(workerPath);

console.log(workerPath, worker);
worker.addEventListener('message', (message) => {
  console.log(message);
});
worker.postMessage('this is a test message to the worker');
