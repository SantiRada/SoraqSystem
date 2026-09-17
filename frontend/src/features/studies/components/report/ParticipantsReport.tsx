import { ChevronRight } from 'lucide-react';
import { Badge } from '@/design-system';
import { useI18n } from '@/i18n';
import type { StudyResponse } from '../../model/types';

/** Participantes: one row per finished participation. A row opens that participant's answers in Preguntas. */
export function ParticipantsReport({ responses, onSelect }: { responses: StudyResponse[]; onSelect: (participant: number) => void }) {
  const { t } = useI18n();

  const duration = (seconds: number | null) => {
    if (seconds === null) return '—';
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? t('studies.report.duration', { minutes, seconds: seconds % 60 }) : t('studies.report.durationSeconds', { seconds });
  };

  return (
    <div className="overflow-x-auto rounded-3xl border border-border bg-surface">
      <table className="w-full min-w-[40rem] border-collapse text-sm">
        <caption className="sr-only">{t('studies.report.table.caption')}</caption>
        <thead>
          <tr className="border-b border-separator text-left text-xs text-muted">
            <th scope="col" className="px-4 py-3 font-medium">
              {t('studies.report.table.participant')}
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              {t('studies.report.table.status')}
            </th>
            <th scope="col" className="px-4 py-3 text-end font-medium">
              {t('studies.report.table.questions')}
            </th>
            <th scope="col" className="px-4 py-3 text-end font-medium">
              {t('studies.report.table.categories')}
            </th>
            <th scope="col" className="px-4 py-3 text-end font-medium">
              {t('studies.report.table.duration')}
            </th>
          </tr>
        </thead>
        <tbody>
          {responses.map((response) => {
            const questions = Object.keys(response.screeningAnswers).length + Object.keys(response.postAnswers).length;
            const created = response.categories.filter((c) => c.predefinedId === null).length;
            const used = response.categories.length - created;
            const name = t('studies.report.participant', { number: response.number });
            return (
              // The whole row is clickable for pointer users; the button in the first cell is the keyboard equivalent.
              <tr key={response.number} onClick={() => onSelect(response.number)} className="group cursor-pointer border-b border-separator transition-colors last:border-0 hover:bg-default-soft">
                <th scope="row" className="px-4 py-3 text-left font-medium">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(response.number);
                    }}
                    aria-label={t('studies.report.table.viewAnswers', { participant: name })}
                    className="inline-flex items-center gap-1 rounded-lg text-left outline-none focus-visible:outline-2 focus-visible:outline-focus"
                  >
                    {name}
                    <ChevronRight aria-hidden="true" className="size-4 text-muted transition-transform group-hover:translate-x-0.5" />
                  </button>
                </th>
                <td className="px-4 py-3">
                  <Badge tone={response.status === 'completed' ? 'success' : 'warning'}>
                    {response.status === 'completed' ? t('studies.report.table.completed') : t('studies.report.table.screenedOut')}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-end tabular-nums">{questions}</td>
                <td className="px-4 py-3 text-end tabular-nums">{response.status === 'completed' ? `${created} / ${used}` : '—'}</td>
                <td className="px-4 py-3 text-end tabular-nums text-muted">{duration(response.durationSeconds)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
