import { Badge, Card } from '@/design-system';
import { useI18n } from '@/i18n';
import type { SortAnalysis } from '../../model/analysis';

const percent = (share: number) => `${Math.round(share * 100)} %`;

/** Clusters detected in the analysis: cards that belong together, with the category names participants used. */
export function ClusterList({ analysis, variant }: { analysis: SortAnalysis; variant: 'matrix' | 'dendrogram' }) {
  const { t } = useI18n();
  const headingId = `clusters-${variant}`;

  return (
    <section aria-labelledby={headingId} className="grid gap-4">
      <header>
        <h3 id={headingId} className="text-base font-semibold">
          {t('cardSorting.report.clusters.title')}
        </h3>
        <p className="text-sm text-muted">{t('cardSorting.report.clusters.description')}</p>
      </header>

      {analysis.clusters.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">{t('cardSorting.report.clusters.none')}</p>
      ) : (
        <ol className="grid list-none gap-3 p-0 md:grid-cols-2">
          {analysis.clusters.map((cluster, i) => {
            const top = cluster.names[0];
            return (
              <li key={cluster.id}>
                <Card className="h-full gap-3 rounded-3xl border border-border bg-surface p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold">{t('cardSorting.report.clusters.cluster', { number: i + 1 })}</h4>
                    <Badge tone="accent">{t('cardSorting.report.clusters.similarity', { share: percent(cluster.similarity) })}</Badge>
                  </div>

                  {variant === 'dendrogram' && (
                    <div>
                      <p className="text-xs text-muted">{t('cardSorting.report.clusters.suggestedName')}</p>
                      {top ? (
                        <>
                          <p className="text-lg font-semibold">
                            {top.label} <span className="text-sm font-normal text-muted">· {percent(top.share)}</span>
                          </p>
                          {cluster.names.length > 1 && (
                            <p className="mt-1 text-xs text-muted">
                              {cluster.names
                                .slice(1, 4)
                                .map((name) => `${name.label} · ${percent(name.share)}`)
                                .join(' — ')}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted">{t('cardSorting.report.clusters.noName')}</p>
                      )}
                    </div>
                  )}

                  <ul className="flex list-none flex-wrap gap-1.5 p-0">
                    {cluster.leaves.map((leaf) => (
                      <li key={leaf} className="rounded-full border border-border px-3 py-1 text-xs">
                        {analysis.cards[leaf]!.label}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted">{t('cardSorting.report.clusters.together', { together: cluster.together, total: cluster.total })}</p>
                </Card>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
