import { useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { IconButton } from '@/design-system';
import { useI18n } from '@/i18n';
import { cn } from '@/shared/lib/cn';
import { toolRows, type Tool } from '../data/tools';
import { SectionHeading } from './SectionHeading';

/**
 * Dropbox Dash-style infinite rows of tool chips.
 * Accessibility: pausable (WCAG 2.2.2), pauses on hover, static for reduced motion,
 * duplicated items (needed for the loop) are hidden from assistive technology.
 */
export function ToolsMarquee() {
  const { t } = useI18n();
  const [paused, setPaused] = useState(false);

  return (
    <section id="herramientas" aria-labelledby="tools-title" className="scroll-mt-20 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <SectionHeading id="tools-title" eyebrow={t('marketing.tools.eyebrow')} title={t('marketing.tools.title')} description={t('marketing.tools.description')} />
      </div>

      <div role="group" aria-label={t('marketing.tools.listLabel')} className="relative grid gap-3" data-paused={paused || undefined}>
        {toolRows.map((row, index) => (
          <div
            key={index}
            className="marquee overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
          >
            <ul
              data-direction={index % 2 === 1 ? 'reverse' : undefined}
              className='marquee-track flex w-max list-none gap-3 p-0 [--marquee-duration:70s]'
            >
              {[...row, ...row].map((tool, i) => (
                <ToolChip key={`${tool.name}-${i}`} tool={tool} isDuplicate={i >= row.length} />
              ))}
            </ul>
          </div>
        ))}

        <div className="mx-auto mt-6 flex max-w-3xl items-center gap-3 px-4">
          <IconButton
            label={paused ? t('marketing.tools.resume') : t('marketing.tools.pause')}
            icon={paused ? <Play /> : <Pause />}
            size="sm"
            variant="tertiary"
            onPress={() => setPaused((p) => !p)}
            className="motion-reduce:hidden"
          />
          <p className="text-xs text-muted">{t('marketing.tools.disclaimer')}</p>
        </div>
      </div>
    </section>
  );
}

function ToolChip({ tool, isDuplicate }: { tool: Tool; isDuplicate: boolean }) {
  const { t } = useI18n();

  return (
    <li
      aria-hidden={isDuplicate || undefined}
      className={cn('flex w-60 items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3', isDuplicate && 'motion-reduce:hidden')}
    >
      <span aria-hidden="true" className={cn('grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-sm font-semibold text-white', tool.tint)}>
        {tool.name[0]}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{tool.name}</span>
        <span className="block truncate text-xs text-muted">{t(`marketing.tools.categories.${tool.category}`)}</span>
      </span>
    </li>
  );
}
