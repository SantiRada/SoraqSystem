import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Alert, SelectField, ToggleButton, ToggleButtonGroup } from '@/design-system';
import { useAuth } from '@/features/auth';
import { locales, useI18n } from '@/i18n';
import { toUserMessage } from '@/shared/api/ApiError';
import { useTheme, type Theme } from '@/shared/theme/ThemeContext';
import { accountApi } from '../api/accountApi';

/**
 * Preferencias tab.
 * - Idioma: saved in the profile (users.locale). Only Spanish exists today (docs/I18N.md §4).
 * - Modo: per device (localStorage), applied instantly.
 */
export function PreferencesTab() {
  const { t } = useI18n();
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const languageOptions = Object.entries(locales).map(([code, meta]) => ({ id: code, label: meta.label }));

  async function changeLanguage(locale: string) {
    if (!user || locale === user.locale) return;
    setNotice(null);
    setError(null);
    try {
      const { user: updated } = await accountApi.updatePreferences(locale);
      updateUser(updated);
      setNotice(t('account.preferences.languageSaved'));
    } catch (err) {
      setError(toUserMessage(err, t));
    }
  }

  return (
    <div className="grid gap-8">
      <section aria-labelledby="pref-language-title" className="grid gap-3">
        <h3 id="pref-language-title" className="text-base font-semibold">
          {t('account.preferences.languageTitle')}
        </h3>
        {notice && <Alert tone="success" title={notice} />}
        {error && <Alert tone="danger" title={error} />}
        <SelectField
          className="max-w-xs"
          label={t('account.preferences.language')}
          value={user?.locale && user.locale in locales ? user.locale : 'es'}
          options={languageOptions}
          onChange={changeLanguage}
          hint={t('account.preferences.languageHint')}
        />
      </section>

      <section aria-labelledby="pref-theme-title" className="grid gap-3">
        <h3 id="pref-theme-title" className="text-base font-semibold">
          {t('account.preferences.themeTitle')}
        </h3>
        <ToggleButtonGroup
          aria-label={t('account.preferences.themeLabel')}
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[theme]}
          onSelectionChange={(keys) => {
            const next = [...keys][0];
            if (next === 'dark' || next === 'light') setTheme(next as Theme);
          }}
          className="self-start"
        >
          <ToggleButton id="dark" className="gap-2">
            <Moon aria-hidden="true" className="size-4" />
            {t('account.preferences.dark')}
          </ToggleButton>
          <ToggleButton id="light" className="gap-2">
            <Sun aria-hidden="true" className="size-4" />
            {t('account.preferences.light')}
          </ToggleButton>
        </ToggleButtonGroup>
        <p className="text-sm text-muted">{t('account.preferences.themeHint')}</p>
      </section>
    </div>
  );
}
