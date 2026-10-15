/**
 * "Crear oportunidad" from a Contact: decides at which Company the new
 * Opportunity lands and whether that Company becomes the Contact's Company.
 * A Contact with a Company brings it along; a Contact without one needs
 * exactly one of an existing Company or a new Company's name. Pure: no I/O,
 * no throw — callers decide how to surface violations.
 */
export type OpportunityFromContactRequest = {
  companyId?: number | null;
  newCompanyName?: string | null;
};

export type PlannedCompany =
  | { kind: 'existing'; companyId: number }
  | { kind: 'new'; name: string };

export type OpportunityFromContactViolation =
  | 'contact_has_company'
  | 'company_required';

export type OpportunityFromContactPlan =
  | { ok: true; company: PlannedCompany; setsContactCompany: boolean }
  | { ok: false; violation: OpportunityFromContactViolation };

export function planOpportunityFromContact(
  contact: { companyId: number | null },
  request: OpportunityFromContactRequest,
): OpportunityFromContactPlan {
  const pickedId = request.companyId ?? null;
  const newName = request.newCompanyName?.trim() || null;

  if (contact.companyId != null) {
    if (
      newName != null ||
      (pickedId != null && pickedId !== contact.companyId)
    ) {
      return { ok: false, violation: 'contact_has_company' };
    }
    return {
      ok: true,
      company: { kind: 'existing', companyId: contact.companyId },
      setsContactCompany: false,
    };
  }

  if ((pickedId == null) === (newName == null)) {
    return { ok: false, violation: 'company_required' };
  }
  return {
    ok: true,
    company:
      pickedId != null
        ? { kind: 'existing', companyId: pickedId }
        : { kind: 'new', name: newName! },
    setsContactCompany: true,
  };
}
