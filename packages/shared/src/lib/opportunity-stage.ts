/**
 * The outcome an Opportunity Stage stands for. Stored as two flags (exactly
 * one stage per Organization is won, one is lost); read it through these
 * helpers rather than the flags. Pure.
 */
export type StageOutcome = "open" | "won" | "lost";

export type StageOutcomeFlags = { isWon: boolean; isLost: boolean };

export function stageOutcome(stage: StageOutcomeFlags): StageOutcome {
  if (stage.isWon) return "won";
  if (stage.isLost) return "lost";
  return "open";
}

/** Neither won nor lost. */
export function isOpenStage(stage: StageOutcomeFlags): boolean {
  return stageOutcome(stage) === "open";
}

const OUTCOME_ORDER: Record<StageOutcome, number> = {
  open: 0,
  won: 1,
  lost: 2,
};

/** Open stages by sort, then the won stage, then the lost one. */
export function sortOpportunityStages<
  S extends StageOutcomeFlags & { sort: number },
>(stages: readonly S[]): S[] {
  return [...stages].sort(
    (a, b) =>
      OUTCOME_ORDER[stageOutcome(a)] - OUTCOME_ORDER[stageOutcome(b)] ||
      a.sort - b.sort,
  );
}
