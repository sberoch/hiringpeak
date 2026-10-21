import {
  isOpenStage,
  stageOutcome,
} from '@workspace/shared/lib/opportunity-stage';
import {
  byPosition,
  moveTo,
  renumber,
} from '../common/ordered-catalog/ordered-catalog';

/**
 * Opportunity Stage layout: the rules that keep an Organization's stages
 * well-formed while they are configured — exactly one won and one lost stage,
 * both sorted after every open stage, and outcome flags that only move between
 * stages holding no Opportunity. Pure: no I/O, no throw — callers decide how to
 * surface violations. See GLOSSARY.md (`Opportunity Stage`).
 *
 * Every successful result is the full, re-numbered layout (sort 0..n-1: open
 * stages in their order, then won, then lost); callers persist what changed.
 */
export type StageSlot = {
  id: number;
  sort: number;
  isWon: boolean;
  isLost: boolean;
};

export type Outcome = 'won' | 'lost';

/** Opportunities per stage id; a missing id means none. */
export type StageUsage = Readonly<Record<number, number>>;

export type BusyStage = { id: number; opportunityCount: number };

export type LayoutResult<V> =
  | { ok: true; stages: StageSlot[] }
  | ({ ok: false } & V);

export type OutcomeReassignmentViolation =
  | { violation: 'stage_not_found' }
  | { violation: 'holds_other_outcome' }
  | { violation: 'stage_in_use'; busy: BusyStage[] };

const isOpen = (stage: StageSlot) => isOpenStage(stage);

/** Re-numbers sort as: open stages in the given order, then won, then lost. */
function arrange(open: StageSlot[], all: StageSlot[]): StageSlot[] {
  const won = all.filter((stage) => stageOutcome(stage) === 'won');
  const lost = all.filter((stage) => stageOutcome(stage) === 'lost');
  return renumber([...open, ...won, ...lost]);
}

function openInOrder(stages: StageSlot[]): StageSlot[] {
  return stages.filter(isOpen).sort(byPosition);
}

export type PlacementViolation =
  | { violation: 'stage_not_found' }
  | { violation: 'outcome_stage_pinned' };

/**
 * Puts open stage `id` at `index` among the open stages (clamped; default
 * last). Used both to reorder and to position a freshly added stage. The won
 * and lost stages can't be moved: they always sort after every open stage.
 */
export function placeOpenStage(
  stages: readonly StageSlot[],
  id: number,
  index?: number,
): LayoutResult<PlacementViolation> {
  const stage = stages.find((s) => s.id === id);
  if (!stage) return { ok: false, violation: 'stage_not_found' };
  if (!isOpen(stage)) return { ok: false, violation: 'outcome_stage_pinned' };

  const open = moveTo(openInOrder([...stages]), id, index);
  return { ok: true, stages: arrange(open, [...stages]) };
}

export type RemovalViolation =
  | { violation: 'stage_not_found' }
  | { violation: 'outcome_stage' }
  | { violation: 'last_open_stage' }
  | { violation: 'stage_in_use'; opportunityCount: number };

/**
 * Removes stage `id`. The won and lost stages can't be removed (exactly one of
 * each must exist), nor the last open stage (where new Opportunities start),
 * nor a stage that still holds Opportunities.
 */
export function removeStage(
  stages: readonly StageSlot[],
  usage: StageUsage,
  id: number,
): LayoutResult<RemovalViolation> {
  const stage = stages.find((s) => s.id === id);
  if (!stage) return { ok: false, violation: 'stage_not_found' };
  if (!isOpen(stage)) return { ok: false, violation: 'outcome_stage' };
  const opportunityCount = usage[id] ?? 0;
  if (opportunityCount > 0) {
    return { ok: false, violation: 'stage_in_use', opportunityCount };
  }
  const rest = stages.filter((s) => s.id !== id);
  if (!rest.some(isOpen)) return { ok: false, violation: 'last_open_stage' };
  return { ok: true, stages: arrange(openInOrder(rest), rest) };
}

/**
 * Gives the won or lost flag to `targetId`, taking it from the stage that holds
 * it now (which becomes the last open stage). Allowed only while neither stage
 * holds any Opportunity, since that would silently reinterpret their outcomes.
 */
export function reassignOutcome(
  stages: readonly StageSlot[],
  usage: StageUsage,
  targetId: number,
  outcome: Outcome,
): LayoutResult<OutcomeReassignmentViolation> {
  const target = stages.find((stage) => stage.id === targetId);
  if (!target) return { ok: false, violation: 'stage_not_found' };
  const holds = (stage: StageSlot) => stageOutcome(stage) === outcome;

  if (holds(target)) {
    return { ok: true, stages: arrange(openInOrder([...stages]), [...stages]) };
  }
  if (!isOpen(target)) return { ok: false, violation: 'holds_other_outcome' };

  const giver = stages.find(holds);
  const busy = [giver, target]
    .filter((stage): stage is StageSlot => stage != null)
    .map((stage) => ({
      id: stage.id,
      opportunityCount: usage[stage.id] ?? 0,
    }))
    .filter((stage) => stage.opportunityCount > 0);
  if (busy.length > 0) return { ok: false, violation: 'stage_in_use', busy };

  const flagged = (stage: StageSlot): StageSlot => {
    if (stage.id === targetId) {
      return { ...stage, isWon: outcome === 'won', isLost: outcome === 'lost' };
    }
    if (giver && stage.id === giver.id) {
      return { ...stage, isWon: false, isLost: false };
    }
    return stage;
  };
  const next = stages.map(flagged);
  // The former holder sat after every open stage, so it stays last among them.
  const open = [
    ...openInOrder(next.filter((stage) => stage.id !== giver?.id)),
    ...next.filter((stage) => stage.id === giver?.id),
  ];
  return { ok: true, stages: arrange(open, next) };
}
