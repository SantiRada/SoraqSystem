import { createContext, useContext } from 'react';
import type { Locale } from './config';
import type { Translate } from './translate';

interface I18nContextValue {
  locale: Locale;
  t: Translate;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

/** `const { t } = useI18n(); t('projects.list.title')` */
export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside <I18nProvider>.');
  return context;
}
