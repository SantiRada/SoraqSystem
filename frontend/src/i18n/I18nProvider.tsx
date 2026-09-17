import { useEffect, useMemo, type ReactNode } from 'react';
import { I18nProvider as AriaI18nProvider } from 'react-aria-components';
import { locales, DEFAULT_LOCALE, type Locale } from './config';
import { I18nContext } from './I18nContext';
import { messages as defaultMessages } from './locales/es';
import { createTranslator } from './translate';

/**
 * Provides `t`, the active locale and keeps <html lang> in sync.
 * Also configures React Aria (HeroUI) so built-in component strings and
 * date/number formatting follow the same language.
 *
 * Today only Spanish exists and is bundled statically (no loading flash).
 * When more languages exist, load them with `locales[locale].load()` and keep
 * the chosen locale in the user profile (users.locale) — docs/I18N.md.
 */
export function I18nProvider({ children, locale = DEFAULT_LOCALE }: { children: ReactNode; locale?: Locale }) {
  const meta = locales[locale];

  const value = useMemo(
    () => ({ locale, t: createTranslator(defaultMessages, meta.htmlLang) }),
    [locale, meta.htmlLang],
  );

  useEffect(() => {
    document.documentElement.lang = meta.htmlLang;
  }, [meta.htmlLang]);

  return (
    <I18nContext value={value}>
      <AriaI18nProvider locale={meta.htmlLang}>{children}</AriaI18nProvider>
    </I18nContext>
  );
}
