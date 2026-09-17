import { ArrowRight, Sparkles } from 'lucide-react';
import { ButtonAnchor, ButtonLink } from '@/design-system';
import { paths } from '@/config/paths';
import { useAuth } from '@/features/auth';
import { useI18n } from '@/i18n';
import { ProductPreview } from './ProductPreview';

/** Centered hero (Antigravity/Dash) over a dot field and accent glow, followed by the product preview (Framer). */
export function HeroSection() {
  const { t } = useI18n();
  const { status } = useAuth();
  const isSignedIn = status === 'authenticated';

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div aria-hidden="true" className="bg-dot-field pointer-events-none absolute inset-0" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-14rem] h-[40rem] w-[70rem] -translate-x-1/2 rounded-full bg-[var(--glow-accent)] opacity-70 blur-[140px]"
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-20 text-center md:px-6 md:pt-28">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-sm text-muted backdrop-blur">
          <Sparkles aria-hidden="true" className="size-4 text-accent-soft-foreground" />
          {t('marketing.hero.badge')}
        </p>

        <h1 id="hero-title" tabIndex={-1} data-page-heading className="text-display mx-auto mt-7 max-w-5xl text-5xl sm:text-6xl md:text-7xl lg:text-[5.75rem]">
          {t('marketing.hero.title')}
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted md:text-xl">{t('marketing.hero.lead')}</p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {isSignedIn ? (
            <ButtonLink to={paths.projects} variant="contrast" size="lg" trailingIcon={<ArrowRight />}>
              {t('marketing.hero.signedInCta')}
            </ButtonLink>
          ) : (
            <ButtonLink to={paths.register} variant="contrast" size="lg" trailingIcon={<ArrowRight />}>
              {t('marketing.hero.primaryCta')}
            </ButtonLink>
          )}
          <ButtonAnchor href="#producto" variant="secondary" size="lg">
            {t('marketing.hero.secondaryCta')}
          </ButtonAnchor>
        </div>

        <div className="mt-16 md:mt-24">
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}
