import { Link } from 'react-router';
import { Card } from '@/design-system';
import { useI18n } from '@/i18n';
import { formatRelativeTime } from '@/shared/i18n/format';
import type { StudySummary } from '../model/types';
import { StatusBadge, TypeBadge } from './badges';

/** Study cards (project list and "shared with you"). */
export function StudyGrid({ studies, studyHref, showProject }: { studies: StudySummary[]; studyHref: (id: string) => string; showProject?: boolean }) {
  const { t } = useI18n();

  return (
    <ul className="grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
      {studies.map((study) => (
        <li key={study.id}>
          <Card className="relative h-full gap-3 rounded-3xl border border-border bg-surface p-5 transition-colors hover:border-border-tertiary hover:bg-surface-secondary focus-within:border-focus">
            <div className="flex flex-wrap gap-1.5">
              <StatusBadge status={study.status} />
              <TypeBadge type={study.sortType} />
            </div>
            <h3 className="text-base font-semibold [overflow-wrap:anywhere]">
              <Link
                to={studyHref(study.id)}
                className="text-foreground no-underline outline-none after:absolute after:inset-0 after:rounded-3xl focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-focus"
              >
                {study.name}
              </Link>
            </h3>
            {showProject && <p className="text-sm text-muted">{t('cardSorting.list.sharedFrom', { project: study.project.name })}</p>}
            <p className="mt-auto text-xs text-muted">
              {t('cardSorting.list.cards', { count: study.cardCount })} · {t('cardSorting.list.participants', { count: study.responseCount })} ·{' '}
              {t('cardSorting.list.updated', { date: formatRelativeTime(study.updatedAt) })}
            </p>
          </Card>
        </li>
      ))}
    </ul>
  );
}
