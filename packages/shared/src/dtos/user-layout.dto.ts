import { z } from "zod";

/**
 * The layouts a User can save: one per list screen (Column Layout) and one
 * per dashboard Widget Area (Dashboard Layout).
 */
export const LAYOUT_KEYS = [
  "candidates",
  "companies",
  "contacts",
  "opportunities",
  "dashboard.stat",
  "dashboard.wide",
  "dashboard.rail",
] as const;

export const LayoutKeySchema = z.enum(LAYOUT_KEYS);

/**
 * A saved layout: the full ordered list of entry keys with a visible flag
 * each. Entry keys aren't checked against any catalogue (unknown ones are
 * ignored when resolving), but each may appear only once.
 */
export const SavedLayoutSchema = z
  .array(
    z.object({ key: z.string().trim().min(1), visible: z.boolean() }).strict(),
  )
  .max(200)
  .refine(
    (entries) => new Set(entries.map((e) => e.key)).size === entries.length,
    { message: "Each key may appear only once" },
  );

export type LayoutKey = z.infer<typeof LayoutKeySchema>;
export type SavedLayoutDto = z.infer<typeof SavedLayoutSchema>;

/** Every layout the User saved, by layout key. Missing = default. */
export type SavedLayouts = Partial<Record<LayoutKey, SavedLayoutDto>>;
