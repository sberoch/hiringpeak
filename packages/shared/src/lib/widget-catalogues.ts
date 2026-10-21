import { PermissionCode } from "../enums";
import { COMMERCIAL_ACCESS_CODES } from "./commercial-access";
import type { LayoutCatalogueEntry } from "./layout";

/**
 * Widget catalogues, one per dashboard Widget Area (Stat, Wide, Rail): the
 * Widgets an Area can show, in default order. Each Area is stored under
 * its own layout key (`dashboard.stat`, `dashboard.wide`, `dashboard.rail`)
 * and resolved with `resolveLayout`, so a Widget never leaves its Area.
 *
 * Keys are stored in Users' saved layouts, so never rename one. New Widgets
 * go in hidden by default; commercial ones declare
 * `requires: COMMERCIAL_ACCESS_CODES`.
 *
 * Only keys, defaults and Permissions live here; the Web app maps each key
 * to its label and component.
 */

/** Stat: the row of single-number stats. */
export const STAT_WIDGETS = [
  { key: "activeVacancies", shownByDefault: true },
  { key: "activeCandidates", shownByDefault: true },
  { key: "avgDaysOpen", shownByDefault: true },
  { key: "myActiveVacancies", shownByDefault: false },
  {
    key: "myOverdueTasks",
    shownByDefault: false,
    requires: [PermissionCode.TASK_READ],
  },
  { key: "candidatesAddedLast30Days", shownByDefault: false },
  {
    key: "openOpportunities",
    shownByDefault: false,
    requires: COMMERCIAL_ACCESS_CODES,
  },
  {
    key: "pipelineFee",
    shownByDefault: false,
    requires: COMMERCIAL_ACCESS_CODES,
  },
] as const satisfies readonly LayoutCatalogueEntry[];

/** Wide: the main column. */
export const WIDE_WIDGETS = [
  { key: "teamPerformance", shownByDefault: true },
  { key: "latestVacancies", shownByDefault: true },
] as const satisfies readonly LayoutCatalogueEntry[];

/** Rail: the side rail. */
export const RAIL_WIDGETS = [
  { key: "dueSoonTasks", shownByDefault: true },
  { key: "latestCandidates", shownByDefault: true },
  {
    key: "noNextStepOpportunities",
    shownByDefault: false,
    requires: COMMERCIAL_ACCESS_CODES,
  },
] as const satisfies readonly LayoutCatalogueEntry[];

export type StatWidgetKey = (typeof STAT_WIDGETS)[number]["key"];
export type WideWidgetKey = (typeof WIDE_WIDGETS)[number]["key"];
export type RailWidgetKey = (typeof RAIL_WIDGETS)[number]["key"];
