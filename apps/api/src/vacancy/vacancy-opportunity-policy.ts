import { PermissionCode } from '@workspace/shared/enums';
import { hasCommercialAccess } from '@workspace/shared/lib/commercial-access';

/**
 * Vacancy from Opportunity — pure, no I/O, no throw (callers decide how to
 * surface a violation). See CONTEXT.md (`Opportunity`).
 *
 * - Only a won Opportunity can produce, or be linked to, a Vacancy: if work
 *   has started, the Opportunity is won.
 * - The Vacancy belongs to the Opportunity's Company.
 *
 * Checked only when the link is made. Moving the Opportunity out of won later
 * leaves its Vacancies and their link untouched (state changes don't cascade).
 */
export interface LinkableOpportunity {
  companyId: number;
  stage: { isWon: boolean };
}

export type VacancyOpportunityResult =
  | { ok: true }
  | { ok: false; reason: 'opportunity_not_won' | 'different_company' };

export const VacancyOpportunityPolicy = {
  canLink(params: {
    opportunity: LinkableOpportunity;
    vacancyCompanyId: number | null;
  }): VacancyOpportunityResult {
    const { opportunity, vacancyCompanyId } = params;
    if (!opportunity.stage.isWon) {
      return { ok: false, reason: 'opportunity_not_won' };
    }
    if (vacancyCompanyId !== opportunity.companyId) {
      return { ok: false, reason: 'different_company' };
    }
    return { ok: true };
  },
};

/**
 * Who may set or clear a Vacancy's Opportunity through the Vacancy API: only
 * CRM_MANAGE. Anyone else is refused before the Opportunity is looked up, so
 * its existence, stage and Company don't leak.
 */
export function canSetVacancyOpportunity(codes: readonly string[]): boolean {
  return codes.includes(PermissionCode.CRM_MANAGE);
}

/** The Vacancy as the viewer may see it: its Opportunity only with commercial access. */
export function vacancyForViewer<T extends object>(
  vacancy: T,
  codes: readonly string[],
): T {
  if (hasCommercialAccess(codes) || !('opportunityId' in vacancy)) {
    return vacancy;
  }
  const { opportunityId: _hidden, ...rest } = vacancy;
  return rest as T;
}
