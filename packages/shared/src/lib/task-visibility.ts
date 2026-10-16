/**
 * What makes a Task commercial (ADR 0005), shared by the API and the Web app.
 * Takes the Task's attachment ids and its sticky "stayed commercial" mark.
 */
export type CommercialTaskShape = {
  opportunityIds?: readonly number[];
  contactIds?: readonly number[];
  /** Set when the Opportunity or Contact that made the Task commercial was deleted. */
  stayedCommercial?: boolean;
};

/**
 * A Task is commercial when any Opportunity or Contact is attached, or when
 * it carries the "stayed commercial" mark. Only Users with commercial access
 * can see, create or own one.
 */
export function isCommercialTask<T extends CommercialTaskShape>(
  task: T,
): boolean {
  return (
    task.stayedCommercial === true ||
    (task.opportunityIds?.length ?? 0) > 0 ||
    (task.contactIds?.length ?? 0) > 0
  );
}
