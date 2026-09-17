import { useMemo, useState } from 'react';
import { Card } from '@/design-system';
import { useI18n } from '@/i18n';
import { cn } from '@/shared/lib/cn';
import type { SortAnalysis, TreeNode } from '../../model/analysis';
import { ChartTooltip, type TooltipAnchor } from './ChartTooltip';
import { ClusterList } from './ClusterList';

const ROW = 30;
const LABEL_W = 210;
const PLOT_W = 560;
const TOP = 34;
const percent = (share: number) => `${Math.round(share * 100)} %`;

interface Placed {
  node: TreeNode;
  x: number;
  y: number;
}

/**
 * Dendrograma (horizontal): leaves on the left; a union is drawn further right the lower its similarity.
 * Hover or focus a union to highlight the cards it joins and see the share, participants and category names used.
 */
export function Dendrogram({ analysis }: { analysis: SortAnalysis }) {
  const { t } = useI18n();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [anchor, setAnchor] = useState<TooltipAnchor | null>(null);
  const { tree, cards } = analysis;

  const layout = useMemo(() => {
    const placed = new Map<number, Placed>();
    if (!tree) return { placed, internal: [] as Placed[] };
    const rowOf = new Map(tree.leaves.map((leaf, i) => [leaf, i]));
    const x = (similarity: number) => LABEL_W + (1 - similarity) * PLOT_W;
    const place = (node: TreeNode): Placed => {
      if (!node.children) {
        const p = { node, x: LABEL_W, y: TOP + rowOf.get(node.leaves[0]!)! * ROW + ROW / 2 };
        placed.set(node.id, p);
        return p;
      }
      const [a, b] = node.children.map(place) as [Placed, Placed];
      const p = { node, x: Math.max(x(node.similarity), a.x, b.x), y: (a.y + b.y) / 2 };
      placed.set(node.id, p);
      return p;
    };
    place(tree);
    return { placed, internal: [...placed.values()].filter((p) => p.node.children) };
  }, [tree]);

  if (!tree || cards.length < 2 || analysis.participants === 0) return <p className="text-sm text-muted">{t('cardSorting.report.notEnough')}</p>;

  const active = activeId !== null ? layout.placed.get(activeId) : undefined;
  const activeLeaves = new Set(active?.node.leaves ?? []);
  const inActive = (node: TreeNode) => Boolean(active) && node.leaves.every((l) => activeLeaves.has(l));
  const clusterNodes = new Set(analysis.clusters.flatMap((c) => collectIds(c)));
  const width = LABEL_W + PLOT_W + 40;
  const height = TOP + tree.leaves.length * ROW + 12;

  return (
    <div className="grid gap-6">
      <Card className="gap-4 rounded-3xl border border-border bg-surface p-5 md:p-6">
        <p className="text-sm text-muted">{t('cardSorting.report.dendrogram.description')}</p>

        <p aria-live="polite" className="sr-only">
          {active
            ? `${t('cardSorting.report.dendrogram.tooltipShare', { share: percent(active.node.similarity) })}. ${t('cardSorting.report.dendrogram.tooltipTogether', { together: active.node.together, total: active.node.total })}. ${t('cardSorting.report.dendrogram.tooltipNames')}: ${active.node.names.slice(0, 5).map((name) => name.label).join(', ') || t('cardSorting.report.dendrogram.tooltipNoNames')}`
            : ''}
        </p>

        <ChartTooltip anchor={active ? anchor : null}>
          {active && (
            <>
              <p className="font-semibold">
                {t('cardSorting.report.dendrogram.tooltipShare', { share: percent(active.node.similarity) })} ·{' '}
                {t('cardSorting.report.dendrogram.tooltipTogether', { together: active.node.together, total: active.node.total })}
              </p>
              <p className="text-muted">{active.node.leaves.map((l) => cards[l]!.label).join(', ')}</p>
              <p className="mt-1">
                <span className="text-muted">{t('cardSorting.report.dendrogram.tooltipNames')}: </span>
                {active.node.names.length
                  ? active.node.names
                      .slice(0, 5)
                      .map((name) => `${name.label} (${name.count})`)
                      .join(', ')
                  : t('cardSorting.report.dendrogram.tooltipNoNames')}
              </p>
            </>
          )}
        </ChartTooltip>

        <div className="overflow-auto">
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="group" aria-label={t('cardSorting.report.dendrogram.label')} onMouseLeave={() => {
            setActiveId(null);
            setAnchor(null);
          }}>
            {/* Axis: similarity from 100 % (left) to 0 % (right). */}
            <g aria-hidden="true">
              <text x={LABEL_W} y={12} className="fill-muted text-[10px]">
                {t('cardSorting.report.dendrogram.axis')}
              </text>
              {[1, 0.75, 0.5, 0.25, 0].map((tick) => (
                <g key={tick}>
                  <line x1={LABEL_W + (1 - tick) * PLOT_W} x2={LABEL_W + (1 - tick) * PLOT_W} y1={TOP - 8} y2={height} className="stroke-separator" strokeDasharray="2 4" />
                  <text x={LABEL_W + (1 - tick) * PLOT_W} y={TOP - 12} textAnchor="middle" className="fill-muted text-[10px]">
                    {percent(tick)}
                  </text>
                </g>
              ))}
            </g>

            {/* Leaf labels */}
            {tree.leaves.map((leaf, i) => (
              <text
                key={leaf}
                x={LABEL_W - 10}
                y={TOP + i * ROW + ROW / 2}
                textAnchor="end"
                dominantBaseline="middle"
                className={cn('text-[12px] transition-opacity', active ? (activeLeaves.has(leaf) ? 'fill-foreground font-semibold' : 'fill-muted') : 'fill-foreground')}
              >
                <title>{cards[leaf]!.label}</title>
                {cards[leaf]!.label.length > 28 ? `${cards[leaf]!.label.slice(0, 27)}…` : cards[leaf]!.label}
              </text>
            ))}

            {/* Unions */}
            {layout.internal.map(({ node, x, y }) => {
              const [a, b] = node.children!.map((child) => layout.placed.get(child.id)!) as [Placed, Placed];
              const highlighted = inActive(node);
              // While hovering, everything outside the union turns grey so the union stands out.
              const stroke = active ? (highlighted ? 'stroke-accent' : 'stroke-default') : clusterNodes.has(node.id) ? 'stroke-accent' : 'stroke-muted';
              const path = `M${a.x},${a.y} H${x} V${b.y} H${b.x}`;
              return (
                <g key={node.id}>
                  <path d={path} fill="none" strokeWidth={highlighted ? 3 : 1.75} className={cn('transition-[stroke-width,opacity]', stroke)} />
                  <circle cx={x} cy={y} r={highlighted && node.id === activeId ? 5 : 3} className={active && !highlighted ? 'fill-default' : 'fill-accent'} />
                  {/* Wide invisible hit area, focusable for keyboard users. */}
                  <path
                    d={path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={14}
                    tabIndex={0}
                    role="img"
                    aria-label={t('cardSorting.report.dendrogram.nodeLabel', {
                      count: node.leaves.length,
                      share: percent(node.similarity),
                      cards: node.leaves.map((l) => cards[l]!.label).join(', '),
                    })}
                    className="cursor-pointer outline-none focus-visible:stroke-focus/40"
                    onMouseMove={(event) => {
                      setActiveId(node.id);
                      setAnchor({ x: event.clientX, y: event.clientY });
                    }}
                    onFocus={(event) => {
                      const box = event.currentTarget.getBoundingClientRect();
                      setActiveId(node.id);
                      setAnchor({ x: box.right, y: box.top + box.height / 2 });
                    }}
                    onBlur={() => {
                      setActiveId(null);
                      setAnchor(null);
                    }}
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </Card>

      <ClusterList analysis={analysis} variant="dendrogram" />
    </div>
  );
}

function collectIds(node: TreeNode): number[] {
  return [node.id, ...(node.children?.flatMap(collectIds) ?? [])];
}
