<template>
  <q-toolbar>
    <q-btn
      v-if="!noMenu"
      flat
      dense
      round
      icon="menu"
      class="on-left"
      @click="toggleLeftDrawer"
    />
    <a href="https://epfl.ch" target="_blank" class="q-mt-sm">
      <img src="EPFL.svg" style="height: 25px" />
    </a>
    <span class="q-ml-md" :class="$q.screen.lt.sm ? 'text-bold' : 'text-h6'">{{ t($q.screen.lt.sm ? 'app_title_sm' : 'app_title') }}</span>
    <!--q-tabs v-if="!$q.screen.lt.sm" shrink stretch active-color="primary" class="q-ml-md">
      <q-route-tab
        to="/"
        :label="t('home')"
        exact
      />
      <q-route-tab
        :label="t('about')"
        to="/page/about"
        exact
      />
    </q-tabs-->
    <q-space />
    <span v-if="!$q.screen.lt.md">
      <q-btn-dropdown flat dense :label="locale">
        <q-list>
          <q-item
            clickable
            v-close-popup
            @click="onLocaleSelection(localeOpt)"
            v-for="localeOpt in localeOptions"
            :key="localeOpt.value"
          >
            <q-item-section>
              <q-item-label>{{ localeOpt.label }}</q-item-label>
            </q-item-section>
            <q-item-section avatar v-if="locale === localeOpt.value">
              <q-icon color="primary" name="check" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
      <q-btn
        flat
        round
        icon="menu_book"
        :title="t('resources')"
        @click="showResources = true"
      ></q-btn>
      <q-btn
        flat
        round
        icon="info"
        :title="t('introduction')"
        @click="showIntro = true"
        class="on-left"
      ></q-btn>
    </span>
    <q-btn v-if="$q.screen.lt.md" flat round icon="more_vert">
      <q-menu>
        <q-list class="bg-white">
          <q-item v-if="$q.screen.lt.sm" clickable v-close-popup to="/">
            <q-item-section>
              <q-item-label>{{ t('home') }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item
            v-if="$q.screen.lt.sm"
            clickable
            v-close-popup
            to="/page/about"
          >
            <q-item-section>
              <q-item-label>{{ t('about') }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-separator v-if="$q.screen.lt.sm" />
          <q-item clickable v-close-popup @click="showResources = true">
            <q-item-section>
              <q-item-label>{{ t('resources') }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="showIntro = true">
            <q-item-section>
              <q-item-label>{{ t('introduction') }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label class="text-uppercase">{{ locale }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="keyboard_arrow_right" />
            </q-item-section>
            <q-menu auto-close anchor="top end" self="top start">
              <q-list>
                <q-item
                  clickable
                  v-close-popup
                  @click="onLocaleSelection(localeOpt)"
                  v-for="localeOpt in localeOptions"
                  :key="localeOpt.value"
                >
                  <q-item-section>
                    <q-item-label>{{ localeOpt.label }}</q-item-label>
                  </q-item-section>
                  <q-item-section avatar v-if="locale === localeOpt.value">
                    <q-icon color="primary" name="check" />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
    <a href="https://www.epfl.ch/labs/eml/" target="_blank" class="q-mt-xs">
      <span class="text-logo q-mb-xs">EML</span>
    </a>
    <span class="text-logo q-mt-xs q-ml-xs q-mr-xs text-grey-6">/</span>
    <a href="https://www.epfl.ch/labs/lch/" target="_blank" class="q-mt-xs">
      <span class="text-logo q-mb-xs">LCH</span>
    </a>
  </q-toolbar>

  <simple-dialog
    v-model="showIntro"
    :content="IntroductionMd"
    width="1000px"
  />

  <simple-dialog v-model="showResources" :title="t('resources')">
    <q-list separator>
      <essential-link
        v-for="link in essentialLinks"
        :key="link.title"
        v-bind="link"
      />
    </q-list>
  </simple-dialog>
</template>

<script setup lang="ts">
import { Cookies, useQuasar } from 'quasar'
import IntroductionEnMd from 'src/assets/introduction-en.md';
import IntroductionFrMd from 'src/assets/introduction-fr.md';
import essentialLinks from 'src/assets/links.json';
import EssentialLink from 'src/components/EssentialLink.vue';
import SimpleDialog from 'src/components/SimpleDialog.vue';
import type { Settings } from 'src/stores/settings';
import { locales } from 'boot/i18n'

interface Props {
  noMenu?: boolean;
}

withDefaults(defineProps<Props>(), {
  noMenu: false,
});
const emit = defineEmits(['toggle']);

const $q = useQuasar();
const { t } = useI18n();
const settingsStore = useSettingsStore();
const { locale } = useI18n();

const showIntro = ref(false);
const showResources = ref(false);

const IntroductionMd = computed(() => locale.value === 'fr' ? IntroductionFrMd : IntroductionEnMd);
const localeOptions = computed(() => {
  return locales.map((key) => ({
    label: key.toUpperCase(),
    value: key,
  }))
})

onMounted(() => {
  if (!settingsStore.settings?.intro_shown) {
    showIntro.value = true;
    settingsStore.saveSettings({ intro_shown: true } as Settings);
  }
});

function toggleLeftDrawer() {
  emit('toggle');
}

function onLocaleSelection(localeOpt: { label: string; value: string }) {
  locale.value = localeOpt.value
  Cookies.set('locale', localeOpt.value)
}
</script>
