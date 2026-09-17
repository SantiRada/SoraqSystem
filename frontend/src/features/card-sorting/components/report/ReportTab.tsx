import { useMemo, useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { Alert, Button, Card, EmptyState, LoadingState, Tabs } from '@/design-system';
import { useI18n } from '@/i18n';
import { toUserMessage } from '@/shared/api/ApiError';
import { useApiQuery } from '@/shared/api/useApiQuery';
import { formatNumber } from '@/shared/i18n/format';
import { cardSortingApi } from '../../api/cardSortingApi';
import { analyzeQuestions, analyzeSort } from '../../model/analysis';
import type { Study } from '../../model/types';
import { Dendrogram } from './Dendrogram';
import { ParticipantsReport } from './ParticipantsReport';
import { QuestionsReport } from './QuestionsReport';
import { SimilarityMatrix } from './SimilarityMatrix';

const SECTIONS = ['questions', 'participants', 'matrix', 'dendrogram'] as const;
type Section = (typeof SECTIONS)[number];

/** Reporte: results of every participant, analysed in the browser (model/analysis.ts). */
export function ReportTab({ study }: { study: Study }) {
  const { t } = useI18n();
  const report = useApiQuery((signal) => cardSortingApi.report(study.id, signal), [study.id, study.responseCount]);
  const [section, setSection] = useState<Section>('questions');
  const [participant, setParticipant] = useState<number | null>(null);

  const analysis = useMemo(() => (report.status === 'success' ? analyzeSort(report.data.responses, study.cards) : null), [report, study.cards]);
  const questions = useMemo(() => (report.status === 'success' ? analyzeQuestions(report.data.responses) : []), [report]);

  if (report.status === 'loading') return <LoadingState label={t('cardSorting.report.loading')} />;
  if (report.status === 'error') {
    return (
      <Alert
        tone="danger"
        title={t('cardSorting.report.loadErrorTitle')}
        action={
          <Button variant="secondary" size="sm" leadingIcon={<RefreshCw />} onPress={report.reload}>
            {t('common.actions.tryAgain')}
          </Button>
        }
      >
        {toUserMessage(report.error, t)}
      </Alert>
    );
  }

  const { responses, inProgressCount } = report.data;
  const completed = responses.filter((r) => r.status === 'completed').length;
  const screenedOut = responses.length - completed;

  return (
    <div className="grid gap-6">
      <dl className="grid grid-cols-3 gap-3">
        {[
          { key: 'completed', value: completed },
          { key: 'screenedOut', value: screenedOut },
          { key: 'inProgress', value: inProgressCount },
        ].map((item) => (
          <Card key={item.key} className="gap-1 rounded-2xl border border-border bg-surface p-4">
            <dt className="text-xs text-muted">{t(`cardSorting.report.summary.${item.key as 'completed'}`)}</dt>
            <dd className="text-2xl font-semibold tabular-nums">{formatNumber(item.value)}</dd>
          </Card>
        ))}
      </dl>

      {responses.length === 0 ? (
        <EmptyState className="min-h-[40dvh] justify-center" icon={<BarChart3 />} title={t('cardSorting.report.emptyTitle')} description={t('cardSorting.report.emptyDescription')} />
      ) : (
        <Tabs selectedKey={section} onSelectionChange={(key) => setSection(key as Section)} className="w-full">
          <Tabs.ListContainer className="overflow-x-auto">
            <Tabs.List aria-label={t('cardSorting.report.sectionsLabel')}>
              {SECTIONS.map((id) => (
                <Tabs.Tab key={id} id={id} className="whitespace-nowrap">
                  {t(`cardSorting.report.sections.${id}`)}
                  <Tabs.Indicator />
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
          <Tabs.Panel id="questions" className="pt-6">
            <QuestionsReport questions={questions} participant={participant} onClearParticipant={() => setParticipant(null)} />
          </Tabs.Panel>
          <Tabs.Panel id="participants" className="pt-6">
            <ParticipantsReport
              responses={responses}
              onSelect={(number) => {
                setParticipant(number);
                setSection('questions');
              }}
            />
          </Tabs.Panel>
          <Tabs.Panel id="matrix" className="pt-6">
            {analysis && <SimilarityMatrix analysis={analysis} />}
          </Tabs.Panel>
          <Tabs.Panel id="dendrogram" className="pt-6">
            {analysis && <Dendrogram analysis={analysis} />}
          </Tabs.Panel>
        </Tabs>
      )}
    </div>
  );
}
