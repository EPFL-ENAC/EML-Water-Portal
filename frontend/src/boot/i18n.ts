import { defineBoot } from '#q-app/wrappers';
import { createI18n } from 'vue-i18n';
import { Quasar, Cookies } from 'quasar';

import messages from 'src/i18n';

export type MessageLanguages = keyof typeof messages;
// Type-define 'en' as the master schema for the resource
export type MessageSchema = (typeof messages)['en'];

const defaultLocales = ['en', 'fr']

const locales = defaultLocales

function getCurrentLocale(): string {
  let detectedLocale = Cookies.get('locale')
    ? Cookies.get('locale') // previously selected
    : Quasar.lang.getLocale() // browser
  if (!detectedLocale) {
    detectedLocale = locales[0]
  } else if (!locales.includes(detectedLocale)) {
    detectedLocale = detectedLocale.split('-')[0]
    if (!detectedLocale || !locales.includes(detectedLocale)) {
      detectedLocale = locales[0]
    }
  }
  return detectedLocale || locales[0] || 'en'
}

const i18n = createI18n<{ message: MessageSchema }, MessageLanguages>({
  locale: getCurrentLocale(),
  fallbackLocale: locales[0] || 'en',
  globalInjection: true,
  legacy: false,
  messages,
})

export default defineBoot(({ app }) => {
  // Set i18n instance on app
  app.use(i18n);
});

const t = i18n.global.t

export { i18n, t, locales, getCurrentLocale }