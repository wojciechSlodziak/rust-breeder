import 'reflect-metadata';
import Vue from 'vue';
import App from './App.vue';
import vuetify from './plugins/vuetify';
import VuetifyConfirm from 'vuetify-confirm';

Vue.config.productionTip = false;
Vue.mixin({
  methods: {
    onNextTickRerender: function(callback) {
      this.$nextTick(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(callback);
        });
      });
    }
  }
});

Vue.use(VuetifyConfirm, { vuetify });

new Vue({
  vuetify,
  render: (h: Function) => h(App)
}).$mount('#app');
