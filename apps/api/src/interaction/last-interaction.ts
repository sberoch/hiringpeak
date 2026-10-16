import type { InteractionType } from '@workspace/shared/enums';
import type { LastInteraction } from '@workspace/shared/types/interaction';

/** The fields "Última interacción" needs from an Interaction. Pure, no I/O. */
export type InteractionStamp = LastInteraction & {
  opportunityId: number | null;
  companyId: number | null;
};

/** Latest by the day it happened, then by id. */
function latest<T extends { id: number; date: string }>(rows: T[]): T | null {
  let best: T | null = null;
  for (const row of rows) {
    if (
      !best ||
      row.date > best.date ||
      (row.date === best.date && row.id > best.id)
    ) {
      best = row;
    }
  }
  return best;
}

/**
 * An Opportunity's last Interaction: the latest tied to it, else the latest
 * with its Company (any Opportunity or none).
 */
export function lastInteractionOfOpportunity(
  opportunity: { id: number; companyId: number },
  candidates: readonly InteractionStamp[],
): LastInteraction | null {
  const pick =
    latest(candidates.filter((i) => i.opportunityId === opportunity.id)) ??
    latest(candidates.filter((i) => i.companyId === opportunity.companyId));
  return pick ? toLast(pick) : null;
}

/** Each key's latest Interaction (e.g. per Contact). */
export function lastInteractionByKey(
  rows: readonly (LastInteraction & { key: number })[],
): Map<number, LastInteraction> {
  const byKey = new Map<number, LastInteraction>();
  for (const row of rows) {
    const current = byKey.get(row.key);
    const better = latest(current ? [current, row] : [row]);
    if (better === row) byKey.set(row.key, toLast(row));
  }
  return byKey;
}

function toLast(row: {
  id: number;
  type: InteractionType;
  date: string;
}): LastInteraction {
  return { id: row.id, type: row.type, date: row.date };
}
