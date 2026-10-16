import { eq, inArray } from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/pg-core';
import {
  contacts,
  interactionContacts,
  interactions,
  opportunities,
  opportunityContacts,
  taskContacts,
  taskOpportunities,
  tasks,
  vacancies,
  type Contact,
  type Interaction,
  type Task,
  type Vacancy,
} from '@workspace/shared/schemas';
import type { DrizzleDatabase } from '../database/types/drizzle';

/*
 * Deleting a commercial record never takes history with it (PRD "Deletion").
 * Each function runs on the caller's transaction, BEFORE the record itself is
 * deleted, and does what the FK cascades alone can't: content-dependent
 * deletes and the sticky `stayedCommercial` mark. The plain unlinks are
 * written out too, so the rule doesn't hinge on how a FK is declared.
 */

type Tx = Pick<DrizzleDatabase, 'select' | 'update' | 'delete'>;

const qb = new QueryBuilder();

/**
 * Opportunities about to be deleted: their Interactions stay on the Company
 * and their Vacancies stay, both unlinked; their Tasks lose the attachment
 * but stay commercial.
 */
export async function releaseOpportunities(tx: Tx, opportunityIds: number[]) {
  if (opportunityIds.length === 0) return;
  await tx
    .update(tasks)
    .set({ stayedCommercial: true } as Partial<Task>)
    .where(
      inArray(
        tasks.id,
        qb
          .select({ id: taskOpportunities.taskId })
          .from(taskOpportunities)
          .where(inArray(taskOpportunities.opportunityId, opportunityIds)),
      ),
    );
  await tx
    .update(interactions)
    .set({ opportunityId: null } as Partial<Interaction>)
    .where(inArray(interactions.opportunityId, opportunityIds));
  await tx
    .update(vacancies)
    .set({ opportunityId: null } as Partial<Vacancy>)
    .where(inArray(vacancies.opportunityId, opportunityIds));
}

/**
 * A Contact about to be deleted: they leave their Interactions, Opportunities
 * and Tasks (those Tasks stay commercial) and stop being anyone's Vacancy
 * Contact. An Interaction left with neither Contacts nor a Company goes.
 */
export async function releaseContact(tx: Tx, contactId: number) {
  const involved = await tx
    .select({
      id: interactions.id,
      companyId: interactions.companyId,
      contactId: interactionContacts.contactId,
    })
    .from(interactions)
    .leftJoin(
      interactionContacts,
      eq(interactionContacts.interactionId, interactions.id),
    )
    .where(
      inArray(
        interactions.id,
        qb
          .select({ id: interactionContacts.interactionId })
          .from(interactionContacts)
          .where(eq(interactionContacts.contactId, contactId)),
      ),
    );

  await tx
    .update(tasks)
    .set({ stayedCommercial: true } as Partial<Task>)
    .where(
      inArray(
        tasks.id,
        qb
          .select({ id: taskContacts.taskId })
          .from(taskContacts)
          .where(eq(taskContacts.contactId, contactId)),
      ),
    );
  await tx
    .update(vacancies)
    .set({ vacancyContactId: null } as Partial<Vacancy>)
    .where(eq(vacancies.vacancyContactId, contactId));
  await deleteInteractions(tx, interactionsLeftEmpty(involved, { contactId }));
  await tx
    .delete(interactionContacts)
    .where(eq(interactionContacts.contactId, contactId));
  await tx
    .delete(opportunityContacts)
    .where(eq(opportunityContacts.contactId, contactId));
  await tx.delete(taskContacts).where(eq(taskContacts.contactId, contactId));
}

/**
 * A Company about to be deleted: its Opportunities (released first, see
 * `releaseOpportunities`) and Vacancies go, as before. Its Contacts stay,
 * without a Company; Interactions with at least one Contact stay without the
 * Company, the ones with only the Company go. Its Tasks lose the attachment
 * through the link table's cascade.
 */
export async function releaseCompany(tx: Tx, companyId: number) {
  const ofCompany = await tx
    .select({ id: opportunities.id })
    .from(opportunities)
    .where(eq(opportunities.companyId, companyId));
  await releaseOpportunities(
    tx,
    ofCompany.map((opportunity) => opportunity.id),
  );
  await tx.delete(opportunities).where(eq(opportunities.companyId, companyId));
  await tx.delete(vacancies).where(eq(vacancies.companyId, companyId));

  const involved = await tx
    .select({
      id: interactions.id,
      companyId: interactions.companyId,
      contactId: interactionContacts.contactId,
    })
    .from(interactions)
    .leftJoin(
      interactionContacts,
      eq(interactionContacts.interactionId, interactions.id),
    )
    .where(eq(interactions.companyId, companyId));
  await deleteInteractions(tx, interactionsLeftEmpty(involved, { companyId }));
  await tx
    .update(interactions)
    .set({ companyId: null } as Partial<Interaction>)
    .where(eq(interactions.companyId, companyId));

  await tx
    .update(contacts)
    .set({ companyId: null } as Partial<Contact>)
    .where(eq(contacts.companyId, companyId));
}

/** One row per (Interaction, involved Contact); `contactId` null if none. */
type InvolvementRow = {
  id: number;
  companyId: number | null;
  contactId: number | null;
};

/**
 * The Interactions that would be left with neither Contacts nor a Company
 * once `gone` (a Contact or a Company) is deleted.
 */
function interactionsLeftEmpty(
  rows: InvolvementRow[],
  gone: { contactId?: number; companyId?: number },
): number[] {
  const kept = new Map<number, boolean>();
  for (const row of rows) {
    const keepsCompany =
      row.companyId != null && row.companyId !== gone.companyId;
    const keepsContact =
      row.contactId != null && row.contactId !== gone.contactId;
    kept.set(
      row.id,
      (kept.get(row.id) ?? false) || keepsCompany || keepsContact,
    );
  }
  return [...kept].filter(([, keeps]) => !keeps).map(([id]) => id);
}

async function deleteInteractions(tx: Tx, ids: number[]) {
  if (ids.length === 0) return;
  await tx.delete(interactions).where(inArray(interactions.id, ids));
}
