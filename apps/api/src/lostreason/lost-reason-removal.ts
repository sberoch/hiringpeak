/**
 * Whether a Lost Reason can be removed. The list is never emptied (entering the
 * lost stage requires a Lost Reason), and a reason that lost Opportunities
 * still carry stays, so their outcome keeps its explanation. Pure: no I/O, no
 * throw. See GLOSSARY.md (`Lost Reason`).
 */
export type LostReasonRemovalResult =
  | { ok: true }
  | { ok: false; violation: 'last_lost_reason' }
  | { ok: false; violation: 'in_use'; opportunityCount: number };

export function checkLostReasonRemoval(state: {
  /** Lost Reasons the Organization has, including the one being removed. */
  reasonCount: number;
  /** Opportunities carrying the one being removed. */
  opportunityCount: number;
}): LostReasonRemovalResult {
  if (state.reasonCount <= 1) {
    return { ok: false, violation: 'last_lost_reason' };
  }
  if (state.opportunityCount > 0) {
    return {
      ok: false,
      violation: 'in_use',
      opportunityCount: state.opportunityCount,
    };
  }
  return { ok: true };
}
