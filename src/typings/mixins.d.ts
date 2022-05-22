import Vue from 'vue';
declare module 'vue/types/vue' {
  interface Vue {
    onNextTickRerender: (callback: Function) => void;
  }
}
