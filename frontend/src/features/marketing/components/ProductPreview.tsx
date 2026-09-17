import { ArrowUp, Lightbulb, Target, Users } from 'lucide-react';
import { projectNavigation } from '@/features/workspace';
import { useI18n } from '@/i18n';
import { cn } from '@/shared/lib/cn';

/**
 * Illustrative product preview (Framer-style glowing window). Built in HTML, not an image:
 * crisp at any size and translatable. Decorative content is hidden from assistive tech;
 * the figcaption describes it.
 */
export function ProductPreview() {
  const { t } = useI18n();

  // Same structure users find inside a project (first sections of the workspace navigation).
  const stages = projectNavigation
    .flatMap((group) => group.sections)
    .slice(0, 6)
    .map((section, index) => ({ icon: section.icon, label: t(section.titleKey), active: index === 0 }));

  const context = [
    { icon: Target, label: t('marketing.preview.problemLabel'), text: t('marketing.preview.problemText') },
    { icon: Users, label: t('marketing.preview.usersLabel'), text: t('marketing.preview.usersText') },
    { icon: Lightbulb, label: t('marketing.preview.hypothesisLabel'), text: t('marketing.preview.hypothesisText') },
  ];

  return (
    <figure className="relative mx-auto max-w-6xl">
      <figcaption className="sr-only">{t('marketing.preview.label')}</figcaption>
      <div aria-hidden="true" className="absolute inset-x-10 -top-10 h-40 rounded-full bg-[var(--glow-accent)] blur-[90px]" />

      <div aria-hidden="true" className="border-glow relative rounded-[28px] bg-surface/80 p-2 text-left shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] backdrop-blur">
        <div className="overflow-hidden rounded-[22px] border border-border bg-background">
          {/* Window bar */}
          <div className="flex items-center gap-3 border-b border-separator px-4 py-3">
            <span className="flex gap-1.5">
              <span className="size-3 rounded-full bg-default" />
              <span className="size-3 rounded-full bg-default" />
              <span className="size-3 rounded-full bg-default" />
            </span>
            <span className="text-sm font-medium">{t('marketing.preview.projectName')}</span>
            <span className="ml-auto hidden items-center gap-2 rounded-full bg-success-soft px-2.5 py-1 text-xs text-success-soft-foreground sm:inline-flex">
              <span className="size-1.5 rounded-full bg-success" />
              {t('marketing.preview.synced')}
            </span>
          </div>

          <div className="grid md:grid-cols-[13rem_minmax(0,1fr)_20rem]">
            {/* Stages */}
            <div className="hidden border-r border-separator p-3 md:block">
              {stages.map(({ icon: Icon, label, active }) => (
                <div
                  key={label}
                  className={cn('mb-1 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted', active && 'bg-default text-foreground')}
                >
                  <Icon className={cn('size-4', active && 'text-accent-soft-foreground')} />
                  {label}
                </div>
              ))}
            </div>

            {/* Context */}
            <div className="p-5">
              <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted">{t('marketing.preview.contextTitle')}</p>
              <div className="grid gap-3">
                {context.map(({ icon: Icon, label, text }) => (
                  <div key={label} className="flex gap-3 rounded-2xl border border-border bg-surface p-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-soft-foreground">
                      <Icon className="size-4" />
                    </span>
                    <span>
                      <span className="block text-xs text-muted">{label}</span>
                      <span className="block text-sm">{text}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI prompt */}
            <div className="border-t border-separator p-5 md:border-l md:border-t-0">
              <div className="rounded-2xl bg-gradient-to-b from-accent/40 to-accent/5 p-px">
                <div className="rounded-[15px] bg-surface p-4">
                  <p className="text-sm leading-relaxed">{t('marketing.preview.promptText')}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {[t('marketing.preview.chips.personas'), t('marketing.preview.chips.flows'), t('marketing.preview.chips.research')].map((chip) => (
                      <span key={chip} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
                        {chip}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="rounded-full bg-default px-2.5 py-1 text-xs">{t('marketing.preview.promptTool')}</span>
                    <span className="grid size-8 place-items-center rounded-full bg-foreground text-background">
                      <ArrowUp className="size-4" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}
