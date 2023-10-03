<template>
  <div>
    <v-btn
      class="cookie-consent_remanage-button"
      icon
      v-if="!isSnackbarOpen && !isManageModalOpen"
      @click="handleCookieButtonClick"
    >
      <v-icon large>
        mdi-cookie
      </v-icon>
    </v-btn>
    <v-snackbar v-model="isSnackbarOpen" multi-line timeout="-1" bottom>
      <div class="d-flex">
        <v-icon large class="cookie-consent_snackbar-cookie-icon hidden-xs-only">
          mdi-cookie
        </v-icon>
        <div>
          This site uses cookies and local storage to deliver its services and to analyze traffic. Functionalities like
          previously calculated genes and saving your preferred options require your acceptance to work.
        </div>
        <div class="cookie-consent_actions flex-column d-flex ml-2">
          <v-btn color="primary" @click="handleAcceptAllClick">
            Accept all
          </v-btn>
          <v-btn @click="handleDeclineAllClick">
            Decline all
          </v-btn>
          <v-btn text @click="handleManageClick">
            Manage
          </v-btn>
        </div>
      </div>
    </v-snackbar>

    <v-dialog v-model="isManageModalOpen" width="600" @click:outside="handleManageModalClose">
      <v-card>
        <v-card-title class="headline px-3 px-sm-5" primary-title>
          <v-icon large class="mr-2">
            mdi-cookie
          </v-icon>
          <h2 class="text-h5">Manage Your Storage Preferences</h2>
        </v-card-title>

        <v-card-text>
          <v-switch
            v-model="essentialCookiesAccepted"
            disabled
            label="Enable Essential Cookies"
            hint="These cookies are necessary to track your Storage preferences."
            persistent-hint
          ></v-switch>
          <v-switch
            v-model="currentFunctionalCookiesAccepted"
            label="Allow Functional Cookies and Local Storage"
            hint="Controls whether functionalities like previously calculated genes and saving your preferred options are enabled."
            persistent-hint
          ></v-switch>
          <v-switch
            v-model="currentAnalyticsCookiesAccepted"
            label="Allow Analytics Cookies"
            hint="Enables Google Analytics to let me better understand how the page is used to more effectively update it in the future."
            persistent-hint
          ></v-switch>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="handleManageModalClose">
            Close
          </v-btn>
          <v-btn color="primary" @click="handleSavePreferences">
            Save Preferences
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { getCookie, getCookies, setCookie, removeCookie } from 'typescript-cookie';
import { OPTIONS_COOKIE_PREFIX } from './Options.vue';

export type CookiesUpdateEvent = {
  functionalCookiesAccepted: boolean;
  analyticsCookiesAccepted: boolean;
};

const PREF_COOKIE_NAME_PREFIX = 'rb-cookie-pref';
const STORAGE_PREFERENCE_DECIDED_COOKIE_NAME = `${PREF_COOKIE_NAME_PREFIX}-storage-preference-decided`;
const FUNCTIONAL_GROUP_COOKIE_NAME = `${PREF_COOKIE_NAME_PREFIX}-functional-cookies-and-storage`;
const ANALYTICS_GROUP_COOKIE_NAME = `${PREF_COOKIE_NAME_PREFIX}-analytics-cookies`;

const FUNCTIONAL_DECLINE_CONFIRM_MODAL_TEXT = 'You might lose previously saved genes or your saved preferred options.';
const FUNCTIONAL_DECLINE_CONFIRM_MODAL_OPTIONS = {
  title: 'Warning',
  buttonTrueText: 'Proceed Anyway',
  buttonFalseText: 'Cancel'
};

const PREFERENCE_EXPIRATION_DAYS = 182;
const CHOICE_EXPIRATION_DAYS = 365;

@Component
export default class CookieConsent extends Vue {
  isSnackbarOpen = false;
  isManageModalOpen = false;
  arePreferencesSet = false;

  essentialCookiesAccepted = true;

  functionalCookiesAccepted = getCookie(FUNCTIONAL_GROUP_COOKIE_NAME) === 'true' || false;
  analyticsCookiesAccepted = getCookie(ANALYTICS_GROUP_COOKIE_NAME) === 'true' || false;

  // These properties hold the temporary decision before it is commited.
  currentFunctionalCookiesAccepted = this.functionalCookiesAccepted;
  currentAnalyticsCookiesAccepted = this.analyticsCookiesAccepted;

  mounted() {
    this.arePreferencesSet = getCookie(STORAGE_PREFERENCE_DECIDED_COOKIE_NAME) === 'true';
    if (this.arePreferencesSet) {
      this.fireCookieStateUpdateEvent();

      // Refresh the duration on the choices so that they are not lost even if User is prompted with
      // the Cookie Consent banner again. Tracking choices for longer will let the User keep his stored data
      // in functionalities like saved genes and persistent options if he decides to keep the functional group enabled.
      this.setGroupChoiceCookies();
    } else {
      this.isSnackbarOpen = true;
    }
  }

  handleAcceptAllClick() {
    this.trackPreferencesSet();
    this.acceptFunctionalCookies();
    this.acceptAnalyticsCookies();
    this.fireCookieStateUpdateEvent();
    this.isSnackbarOpen = false;
  }

  handleDeclineAllClick() {
    this.isSnackbarOpen = false;
    this.checkIfNeedsConfirmationModal(true).then((confirmed) => {
      if (confirmed) {
        this.trackPreferencesSet();
        this.declineFunctionalCookies();
        this.declineAnalyticsCookies();
        this.fireCookieStateUpdateEvent();
        this.isSnackbarOpen = false;
      } else {
        this.isSnackbarOpen = true;
      }
    });
  }

  handleManageClick() {
    this.isSnackbarOpen = false;
    this.isManageModalOpen = true;
  }

  handleCookieButtonClick() {
    this.isManageModalOpen = true;
  }

  handleSavePreferences() {
    this.isManageModalOpen = false;
    this.checkIfNeedsConfirmationModal(this.currentFunctionalCookiesAccepted === false).then((confirmed) => {
      if (confirmed) {
        this.trackPreferencesSet();

        this.functionalCookiesAccepted = this.currentFunctionalCookiesAccepted;
        this.analyticsCookiesAccepted = this.currentAnalyticsCookiesAccepted;

        this.setGroupChoiceCookies();

        this.fireCookieStateUpdateEvent();
      } else {
        this.isManageModalOpen = true;
      }
    });
  }

  setGroupChoiceCookies() {
    if (this.functionalCookiesAccepted) {
      this.acceptFunctionalCookies();
    } else {
      this.declineFunctionalCookies();
    }

    if (this.analyticsCookiesAccepted) {
      this.acceptAnalyticsCookies();
    } else {
      this.declineAnalyticsCookies();
    }
  }

  checkIfNeedsConfirmationModal(willDeclineFunctionalCookies: boolean) {
    return this.functionalCookiesAccepted && willDeclineFunctionalCookies
      ? this.$confirm(FUNCTIONAL_DECLINE_CONFIRM_MODAL_TEXT, FUNCTIONAL_DECLINE_CONFIRM_MODAL_OPTIONS)
      : Promise.resolve(true);
  }

  handleManageModalClose() {
    this.isManageModalOpen = false;

    // Since User closed the modal without saving his preference we need to undo his change.
    this.currentFunctionalCookiesAccepted = this.functionalCookiesAccepted;
    this.currentAnalyticsCookiesAccepted = this.analyticsCookiesAccepted;

    if (!this.arePreferencesSet) {
      this.isSnackbarOpen = true;
    }
  }

  trackPreferencesSet() {
    this.arePreferencesSet = true;
    setCookie(STORAGE_PREFERENCE_DECIDED_COOKIE_NAME, true, { expires: PREFERENCE_EXPIRATION_DAYS });
  }

  acceptFunctionalCookies() {
    this.functionalCookiesAccepted = true;
    this.currentFunctionalCookiesAccepted = this.functionalCookiesAccepted;
    setCookie(FUNCTIONAL_GROUP_COOKIE_NAME, this.functionalCookiesAccepted, { expires: CHOICE_EXPIRATION_DAYS });
  }

  declineFunctionalCookies() {
    this.functionalCookiesAccepted = false;
    this.currentFunctionalCookiesAccepted = this.functionalCookiesAccepted;
    setCookie(FUNCTIONAL_GROUP_COOKIE_NAME, this.functionalCookiesAccepted, { expires: CHOICE_EXPIRATION_DAYS });

    this.clearFunctionalCookiesAndStorage();
  }

  acceptAnalyticsCookies() {
    this.analyticsCookiesAccepted = true;
    this.currentAnalyticsCookiesAccepted = this.analyticsCookiesAccepted;
    setCookie(ANALYTICS_GROUP_COOKIE_NAME, this.analyticsCookiesAccepted, { expires: CHOICE_EXPIRATION_DAYS });
  }

  declineAnalyticsCookies() {
    this.analyticsCookiesAccepted = false;
    this.currentAnalyticsCookiesAccepted = this.analyticsCookiesAccepted;
    setCookie(ANALYTICS_GROUP_COOKIE_NAME, this.analyticsCookiesAccepted, { expires: CHOICE_EXPIRATION_DAYS });
    this.clearAnalyticsCookies();
  }

  fireCookieStateUpdateEvent() {
    const eventData: CookiesUpdateEvent = {
      functionalCookiesAccepted: this.functionalCookiesAccepted,
      analyticsCookiesAccepted: this.analyticsCookiesAccepted
    };
    this.$emit('cookies-updated', eventData);
  }

  clearFunctionalCookiesAndStorage() {
    Object.keys(getCookies())
      .filter((cookieName) => cookieName.startsWith(OPTIONS_COOKIE_PREFIX))
      .forEach((cookieName) => {
        removeCookie(cookieName);
      });

    // Clears localStorage, which is set by PreviousGenes component to show calculation history.
    localStorage.clear();
  }

  clearAnalyticsCookies() {
    // Removes all cookies that are not set by RustBreeder.
    // At the RustBreeder only sets cookies from options and from cookie/storage preferences.

    // GA sets cookkies on .domain.com so we need to find this value from the current domain.
    const lastDomainDotIndex = location.hostname.lastIndexOf('.');
    if (lastDomainDotIndex !== -1) {
      const secondToLastDomainDotIndex = location.hostname.lastIndexOf('.', lastDomainDotIndex - 1);
      const gaDomain = location.hostname.substring(secondToLastDomainDotIndex, location.hostname.length);
      Object.keys(getCookies())
        .filter(
          (cookieName) =>
            !cookieName.startsWith(OPTIONS_COOKIE_PREFIX) && !cookieName.startsWith(PREF_COOKIE_NAME_PREFIX)
        )
        .forEach((cookieName) => {
          removeCookie(cookieName, { domain: gaDomain });
        });
    }
  }
}
</script>

<style scoped lang="scss">
.cookie-consent_actions {
  gap: 10px;
}
.cookie-consent_snackbar-cookie-icon {
  position: absolute;
  top: -15px;
  left: -12px;
}
.cookie-consent_remanage-button {
  position: fixed;
  bottom: 10px;
  left: 10px;
}
</style>
