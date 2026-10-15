import {
  isOpenStage,
  sortOpportunityStages,
  type StageOutcomeFlags,
} from "./opportunity-stage.js";

/**
 * Groups a (filtered) set of Opportunities by Opportunity Stage and totals
 * their Estimated Fees, for the Opportunities table. Open stages come first by
 * sort, then won, then lost (collapsed by default). Opportunities without an
 * Estimated Fee count but are left out of every sum. Pure.
 */
export type GroupableStage = StageOutcomeFlags & {
  id: number;
  name: string;
  sort: number;
};

export type GroupableOpportunity = {
  stageId: number;
  estimatedFee: number | null;
};

export type OpportunityStageGroup<
  S extends GroupableStage,
  T extends GroupableOpportunity,
> = {
  stage: S;
  items: T[];
  count: number;
  estimatedFeeTotal: number;
  /** Won and lost groups start collapsed. */
  collapsed: boolean;
};

export type OpportunitiesByStage<
  S extends GroupableStage,
  T extends GroupableOpportunity,
> = {
  groups: OpportunityStageGroup<S, T>[];
  /** Open (neither won nor lost) Opportunities: count and Estimated Fee total. */
  open: { count: number; estimatedFeeTotal: number };
};

export function groupOpportunitiesByStage<
  S extends GroupableStage,
  T extends GroupableOpportunity,
>(stages: readonly S[], items: readonly T[]): OpportunitiesByStage<S, T> {
  const groups = sortOpportunityStages(stages).map((stage) => {
    const stageItems = items.filter((item) => item.stageId === stage.id);
    return {
      stage,
      items: stageItems,
      count: stageItems.length,
      estimatedFeeTotal: sumEstimatedFees(stageItems),
      collapsed: !isOpenStage(stage),
    };
  });
  const openItems = groups
    .filter((g) => isOpenStage(g.stage))
    .flatMap((g) => g.items);
  return {
    groups,
    open: {
      count: openItems.length,
      estimatedFeeTotal: sumEstimatedFees(openItems),
    },
  };
}

function sumEstimatedFees(items: readonly GroupableOpportunity[]): number {
  return items.reduce((total, item) => total + (item.estimatedFee ?? 0), 0);
}
