import { Link, Outlet, useLocation } from 'react-router';
import { Logo, SkipLink } from '@/design-system';
import { paths } from '@/config/paths';
import { AccountMenu } from '@/features/account';
import { SignOutButton } from '@/features/auth';
import { useI18n } from '@/i18n';
import { ThemeToggle } from '@/shared/theme/ThemeToggle';

/**
 * Authenticated shell OUTSIDE a project (e.g. the projects list).
 * No sidebar: brand floats top-left; account menu (Perfil), mode switch and sign out float top-right.
 * Inside a project the workspace layout (features/workspace) takes over with its sidebars.
 */
export function AppLayout() {
  const { t } = useI18n();
  const { pathname } = useLocation();

  return (
    <div className="min-h-dvh">
      <SkipLink />

      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-start justify-between gap-3 p-3 md:p-5">
        <Link
          to={paths.projects}
          aria-label={t('common.a11y.appHomeLink')}
          className="pointer-events-auto inline-flex items-center rounded-full border border-border bg-surface/80 px-3 py-2 shadow-overlay backdrop-blur-xl"
        >
          <Logo size="sm" />
        </Link>

        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-surface/80 p-1 shadow-overlay backdrop-blur-xl">
          <AccountMenu variant="chip" placement="bottom end" />
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-6xl px-4 pb-20 pt-24 md:px-8 md:pt-32">
        <div key={pathname} data-animate-enter>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
