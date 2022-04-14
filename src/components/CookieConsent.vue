<template>
  <v-snackbar v-model="isOpen" multi-line timeout="-1" bottom
    >This site uses cookies to deliver its services and to analyze traffic.
    <template v-slot:action="{ attrs }">
      <v-btn text v-bind="attrs" color="primary" @click="acceptCookies">
        OK
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { getCookie, setCookie } from 'typescript-cookie';

@Component
export default class CookieConsent extends Vue {
  isOpen = false;

  mounted() {
    const areCookiesAccepted = getCookie('ca');
    if (!areCookiesAccepted) {
      this.isOpen = true;
    } else {
      this.fireAcceptedEvent();
    }
  }

  acceptCookies() {
    setCookie('ca', true, { expires: 356 });
    this.fireAcceptedEvent();
    this.isOpen = false;
  }

  fireAcceptedEvent() {
    this.$emit('cookies-accepted');
  }
}
</script>
