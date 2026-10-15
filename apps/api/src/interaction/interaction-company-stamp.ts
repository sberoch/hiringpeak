/**
 * The Company an Interaction is recorded with: the Company *at the time*.
 * Pure: no I/O, no throw — returns the Company to stamp or a violation; the
 * caller decides how to surface it. Stamped once, at creation, and never
 * rewritten when a Contact later moves (ADR 0004).
 */

export type InteractionCompanyInput = {
  /** The Company the user picked; absent: default it. `null`: none. */
  companyId?: number | null;
  /** The Company of the Opportunity it is tied to, if any. */
  opportunityCompanyId?: number | null;
  /** The current Company of each involved Contact (null: no Company). */
  contactCompanyIds: readonly (number | null)[];
};

export const INTERACTION_NEEDS_CONTACT_OR_COMPANY =
  'La interacción tiene que ser con al menos un contacto o una empresa.';

export const INTERACTION_OPPORTUNITY_OF_ANOTHER_COMPANY =
  'La oportunidad es de otra empresa.';

/** The Company to stamp, or a violation (then `companyId` is meaningless). */
export type InteractionCompanyStamp = {
  companyId: number | null;
  violation: string | null;
};

export function stampInteractionCompany(
  input: InteractionCompanyInput,
): InteractionCompanyStamp {
  const opportunityCompanyId = input.opportunityCompanyId ?? null;
  const companyId =
    input.companyId !== undefined
      ? input.companyId
      : (opportunityCompanyId ?? sharedCompany(input.contactCompanyIds));
  if (opportunityCompanyId != null && companyId !== opportunityCompanyId) {
    return { companyId, violation: INTERACTION_OPPORTUNITY_OF_ANOTHER_COMPANY };
  }
  if (companyId == null && input.contactCompanyIds.length === 0) {
    return { companyId, violation: INTERACTION_NEEDS_CONTACT_OR_COMPANY };
  }
  return { companyId, violation: null };
}

/** The one Company every Contact is currently at, else null. */
function sharedCompany(companyIds: readonly (number | null)[]): number | null {
  const [first] = companyIds;
  if (first == null) return null;
  return companyIds.every((id) => id === first) ? first : null;
}
