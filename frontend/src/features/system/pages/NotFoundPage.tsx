import { useNavigate } from 'react-router';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button, ButtonLink } from '@/design-system';
import { paths } from '@/config/paths';
import { useAuth } from '@/features/auth';
import { useI18n } from '@/i18n';
import { usePageMeta } from '@/shared/seo/usePageMeta';

/** 404 for unknown URLs (public or inside the app): a way forward and a way back. */
export function NotFoundPage() {
  const { t } = useI18n();
  usePageMeta({ title: t('system.notFound.metaTitle'), description: t('system.notFound.metaDescription'), noindex: true });
  const navigate = useNavigate();
  const { status } = useAuth();
  const isSignedIn = status === 'authenticated';
  const canGoBack = typeof window !== 'undefined' && window.history.length > 1;

  return (
    <section aria-labelledby="not-found-title" className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <div aria-hidden="true" className="mb-6 grid size-14 place-items-center rounded-2xl border border-border bg-surface text-accent-soft-foreground">
        <Compass className="size-7" />
      </div>
      <p className="mb-2 font-mono text-sm text-muted">{t('system.notFound.code')}</p>
      <h1 id="not-found-title" tabIndex={-1} data-page-heading className="text-display text-4xl md:text-5xl">
        {t('system.notFound.title')}
      </h1>
      <p className="mt-4 text-muted">{t('system.notFound.description')}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink to={isSignedIn ? paths.projects : paths.home} variant="contrast">
          {isSignedIn ? t('system.notFound.goToProjects') : t('system.notFound.goHome')}
        </ButtonLink>
        {canGoBack && (
          <Button variant="secondary" leadingIcon={<ArrowLeft />} onPress={() => navigate(-1)}>
            {t('common.actions.goBack')}
          </Button>
        )}
      </div>
    </section>
  );
}
