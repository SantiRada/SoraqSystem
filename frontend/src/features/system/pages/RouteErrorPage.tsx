import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import { Button, Logo, SkipLink } from '@/design-system';
import { env } from '@/config/env';
import { paths } from '@/config/paths';
import { useI18n } from '@/i18n';
import { usePageMeta } from '@/shared/seo/usePageMeta';
import { NotFoundPage } from './NotFoundPage';

/**
 * Router-level error boundary. Standalone (layouts may be what failed).
 * Never shows technical details; logs them in development only.
 */
export function RouteErrorPage() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <main id="main-content">
        <NotFoundPage />
      </main>
    );
  }

  return <UnexpectedError error={error} />;
}

function UnexpectedError({ error }: { error: unknown }) {
  const { t } = useI18n();
  usePageMeta({ title: t('system.error.metaTitle'), noindex: true });

  if (env.isDev) console.error(error);

  return (
    <div className="flex min-h-dvh flex-col px-4 py-6">
      <SkipLink />
      <header>
        <Link to={paths.home} aria-label={t('common.a11y.homeLink')} className="inline-flex rounded-lg">
          <Logo />
        </Link>
      </header>
      <main id="main-content" className="flex flex-1 items-center justify-center">
        <section aria-labelledby="error-title" className="flex max-w-xl flex-col items-center text-center">
          <div aria-hidden="true" className="mb-6 grid size-14 place-items-center rounded-2xl border border-border bg-surface text-warning">
            <TriangleAlert className="size-7" />
          </div>
          <h1 id="error-title" tabIndex={-1} data-page-heading className="text-display text-4xl">
            {t('system.error.title')}
          </h1>
          <p className="mt-4 text-muted">{t('system.error.description')}</p>
          <Button variant="contrast" className="mt-8" leadingIcon={<RefreshCw />} onPress={() => window.location.reload()}>
            {t('system.error.reload')}
          </Button>
        </section>
      </main>
    </div>
  );
}
