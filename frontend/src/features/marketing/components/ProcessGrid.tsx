import { FlaskConical, Compass, PackageCheck, PenTool } from 'lucide-react';
import { useI18n } from '@/i18n';
import { SectionHeading } from './SectionHeading';

const stages = [
  { key: 'plan', icon: Compass },
  { key: 'design', icon: PenTool },
  { key: 'testing', icon: FlaskConical },
  { key: 'deliverables', icon: PackageCheck },
] as const;

/** Bento grid of the four project areas (same structure as the project workspace, /_SITEMAP.md). */
export function ProcessGrid() {
  const { t } = useI18n();

  return (
    <section id="proceso" aria-labelledby="process-title" className="scroll-mt-20 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeading id="process-title" eyebrow={t('marketing.process.eyebrow')} title={t('marketing.process.title')} />

        <ol className="grid list-none gap-4 p-0 sm:grid-cols-2">
          {stages.map(({ key, icon: Icon }, index) => (
            <li
              key={key}
              className="group relative overflow-hidden rounded-3xl border border-border bg-surface p-7 transition-colors hover:border-border-tertiary"
            >
              <div aria-hidden="true" className="absolute -right-16 -top-16 size-40 rounded-full bg-[var(--glow-accent)] opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />
              <div className="relative flex items-center justify-between">
                <span aria-hidden="true" className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-accent-soft-foreground">
                  <Icon className="size-5" />
                </span>
                <span aria-hidden="true" className="font-mono text-sm text-muted">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="relative mt-8 text-xl font-semibold tracking-tight">{t(`marketing.process.stages.${key}.title`)}</h3>
              <p className="relative mt-2 text-muted">{t(`marketing.process.stages.${key}.text`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
