import { Link, Outlet } from 'react-router';
import { CheckCircle2 } from 'lucide-react';
import { Logo, SkipLink } from '@/design-system';
import { paths } from '@/config/paths';
import { useI18n } from '@/i18n';

/**
 * Sign-in / sign-up: one task, no distractions (Hick). On large screens a brand panel
 * reinforces the value proposition without competing with the form.
 */
export function AuthLayout() {
  const { t } = useI18n();
  const points = [t('auth.layout.points.context'), t('auth.layout.points.validation'), t('auth.layout.points.ai')];

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <SkipLink />
      <div className="flex flex-col px-4 py-6 md:px-10">
        <header>
          <Link to={paths.home} aria-label={t('common.a11y.homeLink')} className="inline-flex rounded-lg">
            <Logo />
          </Link>
        </header>
        <main id="main-content" className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <Outlet />
          </div>
        </main>
      </div>

      <aside aria-hidden="true" className="relative hidden overflow-hidden border-l border-separator bg-surface lg:flex lg:items-end">
        <div className="bg-dot-field absolute inset-0" />
        <div className="absolute -right-32 -top-32 size-[36rem] rounded-full bg-[var(--glow-accent)] blur-[120px]" />
        <div className="absolute -bottom-40 left-0 size-[28rem] rounded-full bg-[var(--glow-violet)] blur-[120px]" />
        <div className="relative p-12">
          <p className="text-display max-w-md text-5xl">{t('auth.layout.title')}</p>
          <p className="mt-4 max-w-md text-muted">{t('auth.layout.description')}</p>
          <ul className="mt-8 grid list-none gap-3 p-0">
            {points.map((point) => (
              <li key={point} className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="size-5 text-accent-soft-foreground" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
