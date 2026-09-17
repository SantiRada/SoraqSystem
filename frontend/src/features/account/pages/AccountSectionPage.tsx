import { Card } from '@/design-system';
import type { AccountTab } from '@/config/paths';
import { useAuth } from '@/features/auth';
import { useI18n } from '@/i18n';
import { usePageMeta } from '@/shared/seo/usePageMeta';
import { BillingTab } from '../components/BillingTab';
import { PreferencesTab } from '../components/PreferencesTab';
import { ProfileTabPanel } from '../components/ProfileTab';
import { SessionTab } from '../components/SessionTab';

const sections = {
  profile: { titleKey: 'account.page.tabs.profile', Content: ProfileTabPanel },
  billing: { titleKey: 'account.page.tabs.billing', Content: BillingTab },
  session: { titleKey: 'account.page.tabs.session', Content: SessionTab },
  preferences: { titleKey: 'account.page.tabs.preferences', Content: PreferencesTab },
} as const;

/** One Perfil section inside AccountLayout. The section's <h2> keeps the heading order below the page <h1>. */
export function AccountSectionPage({ tab }: { tab: AccountTab }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { titleKey, Content } = sections[tab];
  usePageMeta({ title: `${t(titleKey)} · ${t('account.page.title')}`, noindex: true });

  if (!user) return null;

  return (
    <Card className="rounded-3xl border border-border bg-surface p-6 md:p-8">
      <section aria-labelledby={`account-${tab}-title`} className="grid gap-6">
        <h2 id={`account-${tab}-title`} className="text-lg font-semibold tracking-tight">
          {t(titleKey)}
        </h2>
        <Content />
      </section>
    </Card>
  );
}
