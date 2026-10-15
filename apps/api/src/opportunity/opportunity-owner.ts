/**
 * The Opportunity Owner of a new Opportunity: the requested one, else the
 * Company's Account Owner, else the creator. Pure: no I/O, no throw. Whether
 * the result has commercial access is checked by the caller.
 */
export function defaultOpportunityOwner(input: {
  requested: number | null | undefined;
  accountOwnerId: number | null;
  creatorId: number;
}): number {
  return input.requested ?? input.accountOwnerId ?? input.creatorId;
}
