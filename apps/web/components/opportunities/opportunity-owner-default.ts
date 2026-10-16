/**
 * The preselected Opportunity Owner of a new Opportunity: the Company's
 * Account Owner, else the current user (each only with commercial access).
 * The API applies the same default when no owner is sent.
 */
export function defaultOpportunityOwnerId(
  accountOwnerId: number | null | undefined,
  me: number | null,
  commercialUsers: readonly { id: number }[],
): number | null {
  const isCommercial = (id: number | null | undefined): id is number =>
    id != null && commercialUsers.some((u) => u.id === id);
  if (isCommercial(accountOwnerId)) return accountOwnerId;
  return isCommercial(me) ? me : null;
}
