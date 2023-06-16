import Vue from 'vue';

const eventBus = new Vue();
export default eventBus;

export const GLOBAL_EVENT_SELECTED_PLANT_TYPE_CHANGED = 'selected-plant-type-changed';
