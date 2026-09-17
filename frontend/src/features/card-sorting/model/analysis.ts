import type { StudyResponse } from './types';

/**
 * Card sorting analysis, computed in the browser from the raw responses (docs/modules/card-sorting.md → "Análisis").
 *
 * - Similarity: for each pair of cards, share of participants who put both in the same group
 *   (denominator = participants whose version of the study contained both cards).
 * - Dendrogram: agglomerative hierarchical clustering with average linkage on that similarity.
 * - Clusters: highest subtrees whose average similarity reaches CLUSTER_THRESHOLD.
 * - Category names are compared normalised (case, accents and spacing ignored); the most used spelling is shown.
 */

export const CLUSTER_THRESHOLD = 0.5;

export interface AnalysisCard {
  id: string;
  label: string;
}

export interface PairStat {
  similarity: number;
  together: number;
  total: number;
}

export interface NameStat {
  key: string;
  label: string;
  count: number;
  share: number;
  variants: { label: string; count: number }[];
}

export interface TreeNode {
  id: number;
  /** Indices into `cards`. */
  leaves: number[];
  /** Average-linkage similarity at which the node was formed (1 for leaves). */
  similarity: number;
  children: [TreeNode, TreeNode] | null;
  /** Participants who placed ALL the node's cards in one group, over those who saw them all. */
  together: number;
  total: number;
  names: NameStat[];
}

export interface SortAnalysis {
  cards: AnalysisCard[];
  participants: number;
  /** matrix[i][j] for card indices. */
  matrix: PairStat[][];
  tree: TreeNode | null;
  /** Leaf order of the dendrogram (used to order the matrix so clusters form blocks). */
  order: number[];
  clusters: TreeNode[];
}

/** Lowercase, no accents, single spaces: "Participación " ≡ "participacion". */
export function normalizeLabel(label: string): string {
  return label.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function analyzeSort(responses: StudyResponse[], currentCards: AnalysisCard[]): SortAnalysis {
  const completed = responses.filter((r) => r.status === 'completed');

  // Cards: current study order first, then cards that only exist in older versions.
  const labels = new Map<string, string>();
  completed.forEach((r) => r.snapshot.cards.forEach((c) => labels.set(c.id, c.label)));
  currentCards.forEach((c) => labels.set(c.id, c.label));
  const seen = new Set(completed.flatMap((r) => r.snapshot.cards.map((c) => c.id)));
  const cards = [...currentCards.filter((c) => seen.has(c.id)), ...[...seen].filter((id) => !currentCards.some((c) => c.id === id)).map((id) => ({ id, label: labels.get(id) ?? id }))];
  const index = new Map(cards.map((c, i) => [c.id, i]));
  const n = cards.length;

  // group[r][cardIndex] = group index of that card for response r (-1 = card not in that version).
  const groups = completed.map((r) => {
    const row = new Array<number>(n).fill(-1);
    r.categories.forEach((category, g) => category.cardIds.forEach((id) => {
      const i = index.get(id);
      if (i !== undefined) row[i] = g;
    }));
    return row;
  });

  const matrix: PairStat[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      let together = 0;
      let total = 0;
      for (const row of groups) {
        if (row[i] === -1 || row[j] === -1) continue;
        total++;
        if (row[i] === row[j]) together++;
      }
      return { similarity: i === j ? 1 : total ? together / total : 0, together: i === j ? total : together, total };
    }),
  );

  const nodeStats = (leaves: number[]) => {
    let together = 0;
    let total = 0;
    const names = new Map<string, Map<string, number>>();
    completed.forEach((r, ri) => {
      const row = groups[ri]!;
      if (leaves.some((l) => row[l] === -1)) return;
      total++;
      const first = row[leaves[0]!]!;
      if (leaves.every((l) => row[l] === first)) together++;
      // Names: groups holding at least half of the node's cards (and 2+ of them).
      const counts = new Map<number, number>();
      leaves.forEach((l) => counts.set(row[l]!, (counts.get(row[l]!) ?? 0) + 1));
      counts.forEach((count, g) => {
        if (count < Math.max(2, Math.ceil(leaves.length / 2)) && leaves.length > 1) return;
        const label = r.categories[g]?.label.trim();
        if (!label) return;
        const key = normalizeLabel(label);
        const variants = names.get(key) ?? new Map<string, number>();
        variants.set(label, (variants.get(label) ?? 0) + 1);
        names.set(key, variants);
      });
    });
    const nameStats: NameStat[] = [...names.entries()]
      .map(([key, variants]) => {
        const list = [...variants.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
        const count = list.reduce((sum, v) => sum + v.count, 0);
        return { key, label: list[0]!.label, count, share: total ? count / total : 0, variants: list };
      })
      .sort((a, b) => b.count - a.count);
    return { together, total, names: nameStats };
  };

  let nextId = 0;
  let nodes: TreeNode[] = cards.map((_, i) => ({ id: nextId++, leaves: [i], similarity: 1, children: null, ...nodeStats([i]) }));

  // Average-linkage agglomerative clustering.
  const linkage = (a: TreeNode, b: TreeNode) => {
    let sum = 0;
    for (const i of a.leaves) for (const j of b.leaves) sum += matrix[i]![j]!.similarity;
    return sum / (a.leaves.length * b.leaves.length);
  };
  while (nodes.length > 1) {
    let best = { a: 0, b: 1, sim: -1 };
    for (let a = 0; a < nodes.length; a++) {
      for (let b = a + 1; b < nodes.length; b++) {
        const sim = linkage(nodes[a]!, nodes[b]!);
        if (sim > best.sim) best = { a, b, sim };
      }
    }
    const left = nodes[best.a]!;
    const right = nodes[best.b]!;
    const leaves = [...left.leaves, ...right.leaves];
    const merged: TreeNode = { id: nextId++, leaves, similarity: best.sim, children: [left, right], ...nodeStats(leaves) };
    nodes = [...nodes.filter((_, i) => i !== best.a && i !== best.b), merged];
  }

  const tree = nodes[0] ?? null;
  const clusters: TreeNode[] = [];
  const collect = (node: TreeNode) => {
    if (node.leaves.length > 1 && node.similarity >= CLUSTER_THRESHOLD) clusters.push(node);
    else node.children?.forEach(collect);
  };
  if (tree && completed.length > 0) collect(tree);

  return {
    cards,
    participants: completed.length,
    matrix,
    tree,
    order: tree ? tree.leaves : [],
    clusters: clusters.sort((a, b) => b.similarity - a.similarity),
  };
}
