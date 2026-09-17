import { Link, Outlet } from 'react-router';
import { ButtonLink, Logo, SkipLink } from '@/design-system';
import { paths } from '@/config/paths';
import { useAuth } from '@/features/auth';
import { useI18n } from '@/i18n';
import { ThemeToggle } from '@/shared/theme/ThemeToggle';

/** Marketing shell (Framer-like): translucent sticky header, full-bleed sections, minimal footer. */
export function PublicLayout() {
  const { t } = useI18n();
  const { status } = useAuth();
  const isSignedIn = status === 'authenticated';

  const sectionLinks = [
    { href: '/#producto', label: t('marketing.nav.product') },
    { href: '/#proceso', label: t('marketing.nav.process') },
    { href: '/#herramientas', label: t('marketing.nav.tools') },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <header className="sticky top-0 z-50 border-b border-separator/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
          <Link to={paths.home} aria-label={t('common.a11y.homeLink')} className="inline-flex rounded-lg">
            <Logo />
          </Link>

          <nav aria-label={t('marketing.nav.label')} className="hidden md:block">
            <ul className="flex list-none items-center gap-1 p-0">
              {sectionLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="rounded-full px-3 py-2 text-sm text-muted no-underline transition-colors hover:text-foreground">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isSignedIn ? (
              <ButtonLink to={paths.projects} variant="contrast" size="sm">
                {t('marketing.nav.openApp')}
              </ButtonLink>
            ) : (
              <>
                <ButtonLink to={paths.login} variant="ghost" size="sm">
                  {t('marketing.nav.signIn')}
                </ButtonLink>
                <ButtonLink to={paths.register} variant="contrast" size="sm">
                  {t('marketing.nav.getStarted')}
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-separator">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[2fr_1fr_1fr] md:px-6">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-muted">{t('meta.tagline')}</p>
          </div>
          <nav aria-label={t('marketing.footer.productHeading')}>
            <h2 className="mb-3 text-sm font-medium">{t('marketing.footer.productHeading')}</h2>
            <ul className="grid list-none gap-2 p-0 text-sm">
              {sectionLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-muted no-underline hover:text-foreground">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label={t('marketing.footer.accountHeading')}>
            <h2 className="mb-3 text-sm font-medium">{t('marketing.footer.accountHeading')}</h2>
            <ul className="grid list-none gap-2 p-0 text-sm">
              <li>
                <Link to={paths.login} className="text-muted no-underline hover:text-foreground">
                  {t('marketing.nav.signIn')}
                </Link>
              </li>
              <li>
                <Link to={paths.register} className="text-muted no-underline hover:text-foreground">
                  {t('marketing.nav.getStarted')}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <p className="mx-auto max-w-7xl px-4 pb-10 text-xs text-muted md:px-6">
          {t('marketing.footer.rights', { year: new Date().getFullYear() })}
        </p>
      </footer>
    </div>
  );
}
