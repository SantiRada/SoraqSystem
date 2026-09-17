import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { ArrowLeft, CreditCard, Settings2, ShieldAlert, UserRound } from 'lucide-react';
import { PageHeader } from '@/design-system';
import { isSafeRedirect, paths, type AccountTab } from '@/config/paths';
import { useI18n, type MessageKey } from '@/i18n';
import { cn } from '@/shared/lib/cn';

const tabs = [
  { id: 'profile', labelKey: 'account.page.tabs.profile', icon: UserRound },
  { id: 'billing', labelKey: 'account.page.tabs.billing', icon: CreditCard },
  { id: 'session', labelKey: 'account.page.tabs.session', icon: ShieldAlert },
  { id: 'preferences', labelKey: 'account.page.tabs.preferences', icon: Settings2 },
] as const satisfies ReadonlyArray<{ id: AccountTab; labelKey: MessageKey; icon: typeof UserRound }>;

/** Where the user came from (e.g. a project), carried in navigation state across tabs. */
export interface AccountLocationState {
  from?: string;
}

/**
 * Perfil as a page (/app/account/*), same pattern as Configuración del proyecto:
 * header + link bar between sections + the section content. "Volver" returns to where Perfil was opened.
 */
export function AccountLayout() {
  const { t } = useI18n();
  const location = useLocation();
  const state = (location.state ?? {}) as AccountLocationState;
  const backTo = isSafeRedirect(state.from) && !state.from.startsWith('/app/account') ? state.from : paths.projects;

  return (
    <>
      <PageHeader
        eyebrow={
          <Link to={backTo} className="inline-flex items-center gap-1.5 text-muted no-underline hover:text-foreground">
            <ArrowLeft aria-hidden="true" className="size-4" />
            {t('common.actions.goBack')}
          </Link>
        }
        title={t('account.page.title')}
        description={t('account.page.description')}
      />

      <nav aria-label={t('account.page.navLabel')} className="-mt-4 mb-8 overflow-x-auto">
        <ul className="flex w-max list-none gap-1 rounded-2xl border border-border bg-surface p-1">
          {tabs.map(({ id, labelKey, icon: Icon }) => (
            <li key={id}>
              <NavLink
                to={paths.account(id)}
                state={state}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-10 items-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm text-muted no-underline transition-colors hover:bg-default-soft hover:text-foreground',
                    isActive && 'bg-default font-medium text-foreground',
                  )
                }
              >
                <Icon aria-hidden="true" className="size-4" />
                {t(labelKey)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <Outlet />
    </>
  );
}
