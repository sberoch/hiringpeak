/**
 * Groups a (filtered) set of Opportunities by Opportunity Stage and totals
 * their Estimated Fees, for the Opportunities pipeline table. Open stages come
 * first by sort, then won, then lost (collapsed by default). Opportunities
 * without an Estimated Fee count but are left out of every sum. Pure.
 */
export type PipelineStage = {
  id: number;
  name: string;
  sort: number;
  isWon: boolean;
  isLost: boolean;
};

export type PipelineItem = {
  stageId: number;
  estimatedFee: number | null;
};

export type PipelineGroup<S extends PipelineStage, T extends PipelineItem> = {
  stage: S;
  items: T[];
  count: number;
  feeTotal: number;
  /** Won and lost groups start collapsed. */
  collapsed: boolean;
};

export type PipelineSummary<S extends PipelineStage, T extends PipelineItem> = {
  groups: PipelineGroup<S, T>[];
  /** Open (neither won nor lost) Opportunities: count and Estimated Fee total. */
  open: { count: number; feeTotal: number };
};

function outcomeRank(stage: PipelineStage): number {
  if (stage.isWon) return 1;
  if (stage.isLost) return 2;
  return 0;
}

export function sortStages<S extends PipelineStage>(stages: readonly S[]): S[] {
  return [...stages].sort(
    (a, b) => outcomeRank(a) - outcomeRank(b) || a.sort - b.sort,
  );
}

export function summarizePipeline<
  S extends PipelineStage,
  T extends PipelineItem,
>(stages: readonly S[], items: readonly T[]): PipelineSummary<S, T> {
  const groups = sortStages(stages).map((stage) => {
    const stageItems = items.filter((item) => item.stageId === stage.id);
    return {
      stage,
      items: stageItems,
      count: stageItems.length,
      feeTotal: sumFees(stageItems),
      collapsed: stage.isWon || stage.isLost,
    };
  });
  const openItems = groups
    .filter((g) => !g.stage.isWon && !g.stage.isLost)
    .flatMap((g) => g.items);
  return {
    groups,
    open: { count: openItems.length, feeTotal: sumFees(openItems) },
  };
}

function sumFees(items: readonly PipelineItem[]): number {
  return items.reduce((total, item) => total + (item.estimatedFee ?? 0), 0);
}
