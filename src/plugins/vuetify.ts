import Vue from 'vue';
import Vuetify from 'vuetify';
import colors from 'vuetify/lib/util/colors';

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    options: { customProperties: true },
    dark: true,
    themes: {
      dark: {
        primary: colors.cyan.darken2,
        cardHighlight: '#FFFFFF'
      },
      light: {
        primary: colors.cyan.darken2,
        cardHighlight: colors.green.accent4
      }
    }
  }
});
