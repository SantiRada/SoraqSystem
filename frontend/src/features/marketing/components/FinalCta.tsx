import { ArrowRight } from 'lucide-react';
import { ButtonLink } from '@/design-system';
import { paths } from '@/config/paths';
import { useAuth } from '@/features/auth';
import { useI18n } from '@/i18n';

export function FinalCta() {
  const { t } = useI18n();
  const { status } = useAuth();
  const isSignedIn = status === 'authenticated';

  return (
    <section aria-labelledby="cta-title" className="px-4 pb-24 md:px-6 md:pb-32">
      <div className="border-glow relative mx-auto max-w-7xl overflow-hidden rounded-[40px] bg-surface px-6 py-20 text-center md:py-28">
        <div aria-hidden="true" className="bg-dot-field absolute inset-0" />
        <div aria-hidden="true" className="absolute bottom-[-18rem] left-1/2 h-[30rem] w-[60rem] -translate-x-1/2 rounded-full bg-[var(--glow-accent)] blur-[120px]" />
        <div className="relative">
          <h2 id="cta-title" className="text-display mx-auto max-w-3xl text-4xl md:text-6xl">
            {t('marketing.cta.title')}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted">{t('marketing.cta.text')}</p>
          <ButtonLink
            to={isSignedIn ? paths.projects : paths.register}
            variant="contrast"
            size="lg"
            className="mt-10"
            trailingIcon={<ArrowRight />}
          >
            {isSignedIn ? t('marketing.hero.signedInCta') : t('marketing.cta.button')}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
