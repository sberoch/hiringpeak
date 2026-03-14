import { organizations } from '@workspace/shared/schemas';

/** Sortable column keys for organization list ordering */
export const SORTABLE_ORGANIZATION_COLUMNS = [
  'id',
  'name',
  'createdAt',
  'updatedAt',
] as const;

export type SortableOrganizationColumnKey =
  (typeof SORTABLE_ORGANIZATION_COLUMNS)[number];

/** Column reference type suitable for drizzle orderBy (e.g. sortOrder(column)) */
export type SortableOrganizationColumn =
  (typeof organizations)[SortableOrganizationColumnKey];

export const SORTABLE_ORGANIZATION_COLUMNS_MAP: Record<
  SortableOrganizationColumnKey,
  SortableOrganizationColumn
> = Object.fromEntries(
  SORTABLE_ORGANIZATION_COLUMNS.map((key) => [key, organizations[key]]),
) as Record<SortableOrganizationColumnKey, SortableOrganizationColumn>;
