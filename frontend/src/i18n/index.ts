/** Public API of the i18n layer. */
export { I18nProvider } from './I18nProvider';
export { useI18n } from './I18nContext';
export { DEFAULT_LOCALE, locales, isSupportedLocale, type Locale } from './config';
export type { MessageKey, MessageParams, Messages } from './types';
