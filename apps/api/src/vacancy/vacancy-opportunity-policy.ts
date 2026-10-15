/**
 * Vacancy from Opportunity — pure, no I/O, no throw (callers decide how to
 * surface a violation). See CONTEXT.md (`Opportunity`).
 *
 * - Only a won Opportunity can produce, or be linked to, a Vacancy: if work
 *   has started, the deal is won.
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
