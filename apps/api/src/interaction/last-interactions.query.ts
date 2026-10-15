import { and, eq, inArray } from 'drizzle-orm';
import { interactionContacts, interactions } from '@workspace/shared/schemas';
import type { LastInteraction } from '@workspace/shared/types/interaction';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { lastInteractionByKey } from './last-interaction';

/**
 * "Última interacción" per Company (Interactions recorded with it) or per
 * Contact (Interactions they were in), within the Organization.
 */
export async function findLastInteractions(
  db: Pick<DrizzleDatabase, 'select'>,
  organizationId: number,
  of: { companyIds: number[] } | { contactIds: number[] },
): Promise<Map<number, LastInteraction>> {
  const fields = {
    id: interactions.id,
    type: interactions.type,
    date: interactions.date,
  };
  const inOrganization = eq(interactions.organizationId, organizationId);

  if ('companyIds' in of) {
    if (of.companyIds.length === 0) return new Map();
    const rows = await db
      .select({ ...fields, key: interactions.companyId })
      .from(interactions)
      .where(
        and(inOrganization, inArray(interactions.companyId, of.companyIds)),
      );
    return lastInteractionByKey(
      rows.filter(
        (row): row is typeof row & { key: number } => row.key != null,
      ),
    );
  }

  if (of.contactIds.length === 0) return new Map();
  const rows = await db
    .select({ ...fields, key: interactionContacts.contactId })
    .from(interactionContacts)
    .innerJoin(
      interactions,
      eq(interactions.id, interactionContacts.interactionId),
    )
    .where(
      and(
        inOrganization,
        inArray(interactionContacts.contactId, of.contactIds),
      ),
    );
  return lastInteractionByKey(rows);
}
