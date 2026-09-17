import { useState, type FocusEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { Button, Card } from '@/design-system';
import { useI18n } from '@/i18n';
import { cn } from '@/shared/lib/cn';
import type { SortAnalysis } from '../../model/analysis';
import { ChartTooltip, type TooltipAnchor } from './ChartTooltip';
import { ClusterList } from './ClusterList';

const LABEL_W = 220;
const percent = (share: number) => `${Math.round(share * 100)} %`;
const short = (label: string, max = 30) => (label.length > max ? `${label.slice(0, max - 1)}…` : label);

/**
 * Matriz de similitud as a right triangle: cards follow the dendrogram order and their names sit on the
 * hypotenuse, so the most similar pairs (neighbours) are next to it and the least similar ones fall towards
 * the 90° corner. Hovering or moving with the arrow keys highlights the pair's row and column; everything
 * else turns grey, and the detail floats next to the pointer.
 */
export function SimilarityMatrix({ analysis }: { analysis: SortAnalysis }) {
  const { t } = useI18n();
  const [active, setActive] = useState<{ r: number; c: number } | null>(null);
  const [anchor, setAnchor] = useState<TooltipAnchor | null>(null);
  const [showList, setShowList] = useState(false);
  const { cards, matrix, order } = analysis;
  const n = order.length;

  if (n < 2 || analysis.participants === 0) return <p className="text-sm text-muted">{t('cardSorting.report.notEnough')}</p>;

  const cell = Math.max(14, Math.min(40, Math.floor(760 / n)));
  const width = (n - 1) * cell + LABEL_W + 8;
  const height = n * cell + 4;
  const at = (r: number, c: number) => matrix[order[r]!]![order[c]!]!;
  const label = (i: number) => cards[order[i]!]!.label;
  const detail = active ? { stat: at(active.r, active.c), a: label(active.r), b: label(active.c) } : null;
  const inCross = (r: number, c: number) => Boolean(active) && (r === active!.r || c === active!.c);
  const labelActive = (i: number) => Boolean(active) && (i === active!.r || i === active!.c);

  const pointAt = (event: MouseEvent<SVGRectElement>, r: number, c: number) => {
    setActive({ r, c });
    setAnchor({ x: event.clientX, y: event.clientY });
  };

  const onKey = (event: KeyboardEvent<SVGSVGElement>) => {
    const moves: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (event.key === 'Escape') {
      setActive(null);
      setAnchor(null);
      return;
    }
    const delta = moves[event.key];
    if (!delta) return;
    event.preventDefault();
    const current = active ?? { r: 1, c: 0 };
    // Stay inside the triangle: column always left of the row.
    const r = Math.min(n - 1, Math.max(1, current.r + delta[0]));
    const c = Math.min(r - 1, Math.max(0, current.c + delta[1]));
    setActive({ r, c });
    const box = event.currentTarget.getBoundingClientRect();
    setAnchor({ x: box.left + c * cell + cell, y: box.top + r * cell + cell });
  };

  const pairs = order
    .flatMap((_, r) => order.slice(0, r).map((__, c) => ({ r, c })))
    .map(({ r, c }) => ({ a: label(r), b: label(c), stat: at(r, c) }))
    .filter((p) => p.stat.together > 0)
    .sort((x, y) => y.stat.similarity - x.stat.similarity);

  return (
    <div className="grid gap-6">
      <Card className="gap-4 rounded-3xl border border-border bg-surface p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="max-w-2xl text-sm text-muted">{t('cardSorting.report.matrix.description')}</p>
          <div aria-hidden="true" className="flex items-center gap-2 text-xs text-muted">
            {t('cardSorting.report.matrix.legendLow')}
            <span className="h-2.5 w-28 rounded-full bg-gradient-to-r from-accent/10 to-accent" />
            {t('cardSorting.report.matrix.legendHigh')}
          </div>
        </div>

        <p aria-live="polite" className="sr-only">
          {detail ? `${t('cardSorting.report.matrix.pair', { a: detail.a, b: detail.b })}: ${t('cardSorting.report.matrix.tooltip', { share: percent(detail.stat.similarity), together: detail.stat.together, total: detail.stat.total })}` : ''}
        </p>

        <div className="overflow-auto">
          <svg
            role="img"
            tabIndex={0}
            aria-label={t('cardSorting.report.matrix.label')}
            aria-describedby="matrix-keyboard-hint"
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            onKeyDown={onKey}
            onMouseLeave={() => {
              setActive(null);
              setAnchor(null);
            }}
            onBlur={(event: FocusEvent) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setActive(null);
                setAnchor(null);
              }
            }}
            className="rounded-xl outline-none focus-visible:outline-2 focus-visible:outline-focus"
          >
            {order.map((_, r) => (
              <g key={r}>
                {order.slice(0, r).map((__, c) => {
                  const stat = at(r, c);
                  const highlighted = inCross(r, c);
                  const isActive = active?.r === r && active?.c === c;
                  return (
                    <g key={c}>
                      <rect
                        x={c * cell + 1}
                        y={r * cell + 1}
                        width={cell - 2}
                        height={cell - 2}
                        rx={Math.min(6, cell / 4)}
                        className={cn('transition-[fill,fill-opacity] duration-150', active && !highlighted ? 'fill-default' : 'fill-accent')}
                        fillOpacity={active && !highlighted ? 1 : 0.08 + 0.92 * stat.similarity}
                        onMouseMove={(event) => pointAt(event, r, c)}
                      />
                      {isActive && <rect className="pointer-events-none fill-none stroke-foreground" strokeWidth={2} x={c * cell} y={r * cell} width={cell} height={cell} rx={6} />}
                      {cell >= 30 && stat.similarity > 0 && (
                        <text
                          x={c * cell + cell / 2}
                          y={r * cell + cell / 2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className={cn('pointer-events-none text-[10px]', active && !highlighted ? 'fill-muted' : stat.similarity > 0.55 ? 'fill-accent-foreground' : 'fill-foreground')}
                        >
                          {Math.round(stat.similarity * 100)}
                        </text>
                      )}
                    </g>
                  );
                })}
                {/* Card name on the hypotenuse */}
                <text
                  x={r * cell + 8}
                  y={r * cell + cell / 2}
                  dominantBaseline="middle"
                  className={cn('text-[12px] transition-[fill] duration-150', labelActive(r) ? 'fill-foreground font-semibold' : active ? 'fill-muted' : 'fill-foreground')}
                >
                  <title>{label(r)}</title>
                  {short(label(r))}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <p id="matrix-keyboard-hint" className="text-xs text-muted">
          {t('cardSorting.report.matrix.keyboardHint')}
        </p>

        <ChartTooltip anchor={detail ? anchor : null}>
          {detail && (
            <>
              <p className="font-semibold">{t('cardSorting.report.matrix.pair', { a: detail.a, b: detail.b })}</p>
              <p className="text-muted">{t('cardSorting.report.matrix.tooltip', { share: percent(detail.stat.similarity), together: detail.stat.together, total: detail.stat.total })}</p>
            </>
          )}
        </ChartTooltip>

        <div>
          <Button variant="ghost" size="sm" aria-expanded={showList} aria-controls="similarity-pairs" onPress={() => setShowList((v) => !v)}>
            {t('cardSorting.report.matrix.tableToggle')}
          </Button>
        </div>
        {showList && (
          <div id="similarity-pairs" data-animate-enter className="max-h-96 overflow-auto rounded-2xl border border-border">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">{t('cardSorting.report.matrix.tableCaption')}</caption>
              <thead>
                <tr className="border-b border-separator text-left text-xs text-muted">
                  <th scope="col" className="px-4 py-2 font-medium">
                    {t('cardSorting.report.matrix.tablePair')}
                  </th>
                  <th scope="col" className="px-4 py-2 text-end font-medium">
                    {t('cardSorting.report.matrix.tableShare')}
                  </th>
                  <th scope="col" className="px-4 py-2 text-end font-medium">
                    {t('cardSorting.report.matrix.tableCount')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pairs.map((pair) => (
                  <tr key={`${pair.a}-${pair.b}`} className="border-b border-separator last:border-0">
                    <th scope="row" className="px-4 py-2 text-left font-normal">
                      {t('cardSorting.report.matrix.pair', { a: pair.a, b: pair.b })}
                    </th>
                    <td className="px-4 py-2 text-end tabular-nums">{percent(pair.stat.similarity)}</td>
                    <td className="px-4 py-2 text-end tabular-nums">
                      {pair.stat.together} / {pair.stat.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ClusterList analysis={analysis} variant="matrix" />
    </div>
  );
}
