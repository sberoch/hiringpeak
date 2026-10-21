import { z } from "zod";

export const SORT_DIRECTIONS = ["asc", "desc"] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

/** How a list is sorted: by which field, which way. */
export type SortOrder<Field extends string> = {
  field: Field;
  direction: SortDirection;
};

/** A `SortOrder` as sent in a query string: `"field:asc|desc"`. */
export type SortOrderParam<Field extends string> = `${Field}:${SortDirection}`;

/**
 * Validates a `"field:asc|desc"` query param against the list's sortable
 * fields and parses it into a `SortOrder`. Anything else fails validation.
 */
export function sortOrderSchema<
  const Fields extends readonly [string, ...string[]],
>(fields: Fields) {
  const shape = z.object({
    field: z.enum(fields),
    direction: z.enum(SORT_DIRECTIONS),
  });
  return z.string().transform((value, ctx): SortOrder<Fields[number]> => {
    const [field, direction, ...rest] = value.split(":");
    const parsed = shape.safeParse({ field, direction });
    if (!parsed.success || rest.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: `Expected "field:asc|desc" with field one of: ${fields.join(", ")}`,
      });
      return z.NEVER;
    }
    return parsed.data as SortOrder<Fields[number]>;
  });
}
