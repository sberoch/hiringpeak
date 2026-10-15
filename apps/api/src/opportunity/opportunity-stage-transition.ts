/**
 * Opportunity stage transition: given the target Opportunity Stage, an optional
 * Lost Reason and an optional Close Date, returns the outcome fields the
 * Opportunity ends up with, or the violated rule. Pure: no I/O, no throw —
 * callers decide how to surface violations. See CONTEXT.md (`Opportunity Stage`,
 * `Lost Reason`, `Opportunity Close Date`).
 */
export type TargetStage = { id: number; isWon: boolean; isLost: boolean };

export type StageTransitionRequest = {
  target: TargetStage;
  lostReasonId?: number | null;
  /** Day `YYYY-MM-DD`; defaults to `today` when entering won or lost. */
  closeDate?: string | null;
  /** Day `YYYY-MM-DD`. */
  today: string;
};

export type OpportunityOutcomeFields = {
  stageId: number;
  lostReasonId: number | null;
  closeDate: string | null;
};

export type StageTransitionViolation = 'lost_reason_required';

export type StageTransitionResult =
  | { ok: true; fields: OpportunityOutcomeFields }
  | { ok: false; violation: StageTransitionViolation };

export function transitionStage(
  request: StageTransitionRequest,
): StageTransitionResult {
  const { target } = request;
  if (target.isLost && request.lostReasonId == null) {
    return { ok: false, violation: 'lost_reason_required' };
  }
  const closed = target.isWon || target.isLost;
  return {
    ok: true,
    fields: {
      stageId: target.id,
      lostReasonId: target.isLost ? (request.lostReasonId ?? null) : null,
      closeDate: closed ? (request.closeDate ?? request.today) : null,
    },
  };
}

export type CloseDateEditResult =
  | { ok: true; closeDate: string }
  | { ok: false; violation: 'not_closed' };

/**
 * Editing the Close Date by hand: allowed only while the Opportunity sits in
 * the won or lost stage, since the date exists only there. Not range-validated
 * (same reasoning as the Vacancy Close Date, ADR 0002).
 */
export function editCloseDate(
  currentStage: Omit<TargetStage, 'id'>,
  closeDate: string,
): CloseDateEditResult {
  if (!currentStage.isWon && !currentStage.isLost) {
    return { ok: false, violation: 'not_closed' };
  }
  return { ok: true, closeDate };
}
