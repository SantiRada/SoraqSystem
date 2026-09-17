import { useState } from 'react';
import { X } from 'lucide-react';
import { Badge, Button, Card, RadioGroupField } from '@/design-system';
import { useI18n } from '@/i18n';
import { formatNumber } from '@/shared/i18n/format';
import type { QuestionReport, QuestionSection } from '../../model/questions';

type Filter = 'all' | QuestionSection;

const percent = (share: number) => `${Math.round(share * 100)} %`;

/** Preguntas: every screening and post-study question with its answers and the majority share. */
export function QuestionsReport({ questions, participant, onClearParticipant }: { questions: QuestionReport[]; participant: number | null; onClearParticipant: () => void }) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<Filter>('all');
  const visible = questions.filter((q) => filter === 'all' || q.section === filter);

  return (
    <div className="grid gap-4">
      {participant !== null && (
        <div data-animate-enter className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/40 bg-accent-soft px-4 py-3">
          <p className="text-sm font-medium text-accent-soft-foreground">
            {t('studies.report.participantFilter', { participant: t('studies.report.participant', { number: participant }) })}
          </p>
          <Button variant="ghost" size="sm" leadingIcon={<X />} onPress={onClearParticipant}>
            {t('studies.report.clearParticipant')}
          </Button>
        </div>
      )}
      <RadioGroupField
        label={t('studies.report.filterLabel')}
        orientation="horizontal"
        value={filter}
        onChange={(value) => setFilter(value as Filter)}
        options={(['all', 'screening', 'post'] as const).map((value) => ({ value, label: t(`studies.report.filters.${value}`) }))}
      />

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">{t('studies.report.noQuestions')}</p>
      ) : (
        <ul className="grid list-none gap-4 p-0">
          {visible.map((question) => (
            <li key={`${question.section}-${question.id}`}>
              <QuestionCard question={question} participant={participant} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function QuestionCard({ question, participant }: { question: QuestionReport; participant: number | null }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const headingId = `question-${question.section}-${question.id}`;
  const listId = `${headingId}-answers`;

  return (
    <Card className="gap-4 rounded-3xl border border-border bg-surface p-5 md:p-6">
      <section aria-labelledby={headingId} className="grid gap-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <Badge tone={question.section === 'screening' ? 'warning' : 'accent'}>{t(`studies.report.sectionBadge.${question.section}`)}</Badge>
              <Badge>{t(`studies.flow.questionTypes.${question.type}`)}</Badge>
            </div>
            <h3 id={headingId} className="text-base font-semibold [overflow-wrap:anywhere]">
              {question.prompt}
            </h3>
            <p className="text-sm text-muted">{t('studies.report.answered', { count: question.answered })}</p>
          </div>
          {participant === null && question.majority.length > 0 && (
            <div className="shrink-0 rounded-2xl bg-accent-soft px-4 py-2 text-end sm:max-w-60">
              <p className="text-xs text-accent-soft-foreground">{t('studies.report.majority')}</p>
              <p className="text-lg font-semibold tabular-nums text-accent-soft-foreground">{percent(question.majority[0]!.share)}</p>
              <p className="text-sm [overflow-wrap:anywhere]">{question.majority.map((m) => m.label).join(' · ')}</p>
              {question.average !== null && <p className="text-xs text-muted">{t('studies.report.average', { value: formatNumber(Math.round(question.average * 10) / 10) })}</p>}
            </div>
          )}
        </header>

        {participant !== null && (
          <p className="whitespace-pre-line rounded-xl bg-surface-secondary/60 px-3 py-2 text-sm [overflow-wrap:anywhere]">
            {question.answers.find((a) => a.participant === participant)?.value ?? <span className="text-muted">{t('studies.report.noParticipantAnswer')}</span>}
          </p>
        )}

        {participant === null && question.type !== 'text' && question.answered > 0 && (
          <ul className="grid list-none gap-2 p-0">
            {question.distribution.map((bucket) => (
              <li key={bucket.key} className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)_4.5rem] items-center gap-3 text-sm">
                <span className="truncate" title={bucket.label}>
                  {bucket.label}
                </span>
                <span aria-hidden="true" className="h-2.5 overflow-hidden rounded-full bg-default">
                  <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.round(bucket.share * 100)}%` }} />
                </span>
                <span className="text-end tabular-nums text-muted">
                  {percent(bucket.share)} ({bucket.count})
                </span>
              </li>
            ))}
          </ul>
        )}

        {participant !== null ? null : question.answers.length === 0 ? (
          <p className="text-sm text-muted">{t('studies.report.noAnswers')}</p>
        ) : (
          <div className="grid gap-2">
            <div>
              <Button variant="ghost" size="sm" aria-expanded={open} aria-controls={listId} onPress={() => setOpen((v) => !v)}>
                {open ? t('studies.report.hideAnswers') : t('studies.report.showAnswers', { count: question.answers.length })}
              </Button>
            </div>
            {open && (
              <ul id={listId} className="grid max-h-80 list-none gap-1 overflow-y-auto p-0">
                {question.answers.map((answer) => (
                  <li key={answer.participant} className="grid gap-0.5 rounded-xl bg-surface-secondary/60 px-3 py-2 text-sm sm:grid-cols-[9rem_minmax(0,1fr)]">
                    <span className="text-muted">{t('studies.report.participant', { number: answer.participant })}</span>
                    <span className="whitespace-pre-line [overflow-wrap:anywhere]">{answer.value}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </Card>
  );
}
