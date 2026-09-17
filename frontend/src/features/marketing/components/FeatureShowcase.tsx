import type { ReactNode } from 'react';
import { ArrowRight, BookOpen, FileSearch, Lightbulb, Target, Users, Wand2 } from 'lucide-react';
import { Badge } from '@/design-system';
import { useI18n } from '@/i18n';
import { cn } from '@/shared/lib/cn';
import { SectionHeading } from './SectionHeading';

/** Dropbox Dash-style large rounded panels: copy on one side, product mock on the other. */
export function FeatureShowcase() {
  const { t } = useI18n();

  return (
    <section id="producto" aria-labelledby="features-title" className="scroll-mt-20 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeading
          id="features-title"
          eyebrow={t('marketing.features.eyebrow')}
          title={t('marketing.features.title')}
          description={t('marketing.features.description')}
        />

        <div className="grid gap-6">
          <FeaturePanel tag={t('marketing.features.context.tag')} title={t('marketing.features.context.title')} text={t('marketing.features.context.text')}>
            <ContextMock />
          </FeaturePanel>
          <FeaturePanel reverse tag={t('marketing.features.native.tag')} title={t('marketing.features.native.title')} text={t('marketing.features.native.text')}>
            <PreferenceTestMock />
          </FeaturePanel>
          <FeaturePanel tag={t('marketing.features.workflows.tag')} title={t('marketing.features.workflows.title')} text={t('marketing.features.workflows.text')}>
            <WorkflowMock />
          </FeaturePanel>
        </div>
      </div>
    </section>
  );
}

function FeaturePanel({ tag, title, text, reverse = false, children }: { tag: string; title: string; text: string; reverse?: boolean; children: ReactNode }) {
  return (
    <article className="grid overflow-hidden rounded-[32px] border border-border bg-surface lg:grid-cols-2">
      <div className={cn('flex flex-col justify-center gap-5 p-8 md:p-12', reverse && 'lg:order-2')}>
        <Badge tone="accent" className="self-start">
          {tag}
        </Badge>
        <h3 className="text-display text-3xl md:text-4xl">{title}</h3>
        <p className="max-w-md text-lg text-muted">{text}</p>
      </div>
      <div aria-hidden="true" className="relative flex min-h-80 items-center justify-center overflow-hidden bg-gradient-to-br from-accent/25 via-surface-secondary to-surface p-8 md:p-12">
        <div className="bg-dot-field absolute inset-0 opacity-60" />
        <div className="relative w-full max-w-md">{children}</div>
      </div>
    </article>
  );
}

function ContextMock() {
  const { t } = useI18n();
  const items = [
    { icon: Target, label: t('marketing.preview.problemLabel'), text: t('marketing.preview.problemText') },
    { icon: Users, label: t('marketing.preview.usersLabel'), text: t('marketing.preview.usersText') },
    { icon: Lightbulb, label: t('marketing.preview.hypothesisLabel'), text: t('marketing.preview.hypothesisText') },
  ];
  const modules = [t('workspace.sections.prototype.title'), t('workspace.sections.designSystem.title'), t('workspace.sections.documentation.title')];

  return (
    <div className="grid gap-3">
      {items.map(({ icon: Icon, label, text }, i) => (
        <div key={label} className={cn('flex gap-3 rounded-2xl border border-border bg-background/90 p-4 shadow-xl backdrop-blur', i === 1 && 'ml-6', i === 2 && 'ml-12')}>
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-soft-foreground">
            <Icon className="size-4" />
          </span>
          <span>
            <span className="block text-xs text-muted">{label}</span>
            <span className="block text-sm">{text}</span>
          </span>
        </div>
      ))}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <ArrowRight className="size-4 text-muted" />
        {modules.map((module) => (
          <span key={module} className="rounded-full border border-border bg-background/80 px-2.5 py-1">
            {module}
          </span>
        ))}
      </div>
    </div>
  );
}

function PreferenceTestMock() {
  const { t, locale } = useI18n();
  const options = [
    { label: t('marketing.features.native.optionA'), value: 62, winner: true },
    { label: t('marketing.features.native.optionB'), value: 38 },
  ];
  const percent = new Intl.NumberFormat(locale, { style: 'percent' });

  return (
    <div className="rounded-3xl border border-border bg-background/90 p-6 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{t('marketing.features.native.mockTitle')}</span>
        <span className="text-xs text-muted">{t('marketing.features.native.participants', { count: 128 })}</span>
      </div>
      <p className="mt-3 text-sm text-muted">{t('marketing.features.native.mockQuestion')}</p>
      <div className="mt-5 grid gap-4">
        {options.map((option) => (
          <div key={option.label}>
            <div className="mb-1.5 flex justify-between text-sm">
              <span>{option.label}</span>
              <span className={option.winner ? 'font-semibold' : 'text-muted'}>{percent.format(option.value / 100)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-default">
              {/* Width via Tailwind arbitrary class (CSP-safe, no inline style). */}
              <div className={cn('h-full rounded-full', option.winner ? 'w-[62%] bg-accent' : 'w-[38%] bg-muted/40')} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkflowMock() {
  const { t } = useI18n();
  const rows = [
    { icon: Wand2, label: t('marketing.features.workflows.mockTool'), value: t('marketing.preview.promptTool') },
    { icon: FileSearch, label: t('marketing.features.workflows.mockSend'), value: t('marketing.features.workflows.mockSendValue') },
    { icon: BookOpen, label: t('marketing.features.workflows.mockExpect'), value: t('marketing.features.workflows.mockExpectValue') },
  ];

  return (
    <div className="rounded-3xl border border-border bg-background/90 p-6 shadow-2xl backdrop-blur">
      <p className="text-xs font-medium text-accent-soft-foreground">{t('marketing.features.workflows.mockStep')}</p>
      <div className="mt-4 grid gap-3">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl bg-surface-secondary px-4 py-3">
            <Icon className="size-4 text-muted" />
            <span className="text-xs text-muted">{label}</span>
            <span className="ml-auto text-sm">{value}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex gap-1.5">
        {[true, true, false, false].map((done, i) => (
          <span key={i} className={cn('h-1.5 flex-1 rounded-full', done ? 'bg-accent' : 'bg-default')} />
        ))}
      </div>
    </div>
  );
}
