/**
 * Supported interface languages. Adding a language (docs/I18N.md):
 *   1. create src/i18n/locales/<code>/ (copy es/, translate; TypeScript enforces every key)
 *   2. add an entry below
 *   3. add backend/lang/<code>/ and list it in backend/config/app.php
 */
export const locales = {
  es: {
    label: 'Español',
    htmlLang: 'es',
    ogLocale: 'es_LA',
  },
} as const;

export type Locale = keyof typeof locales;

export const DEFAULT_LOCALE: Locale = 'es';

export function isSupportedLocale(value: unknown): value is Locale {
  return typeof value === 'string' && Object.hasOwn(locales, value);
}
