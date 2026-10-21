import { COMMERCIAL_ACCESS_CODES } from "./commercial-access";
import type { LayoutCatalogueEntry } from "./layout";

/**
 * Column Catalogues, one per list screen: the columns a screen can show,
 * in default order. Keys are stored in Users' saved layouts, so never
 * rename one. New columns go in hidden by default unless they matter
 * enough to appear at the end of every existing layout.
 *
 * Only keys, defaults, locks and Permissions live here; the Web app maps
 * each key to its header and cell.
 */

export const CANDIDATE_COLUMNS = [
  { key: "name", shownByDefault: true, lock: "first" },
  { key: "vacancies", shownByDefault: true },
  { key: "tags", shownByDefault: true },
  { key: "seniority", shownByDefault: true },
  { key: "areas", shownByDefault: true },
  { key: "industries", shownByDefault: true },
  { key: "stars", shownByDefault: true },
  { key: "actions", shownByDefault: true, lock: "last" },
] as const satisfies readonly LayoutCatalogueEntry[];

export type CandidateColumnKey = (typeof CANDIDATE_COLUMNS)[number]["key"];

/** Contacts (the whole screen needs commercial access, so no `requires`). */
export const CONTACT_COLUMNS = [
  { key: "name", shownByDefault: true, lock: "first" },
  { key: "company", shownByDefault: true },
  { key: "source", shownByDefault: true },
  { key: "owner", shownByDefault: true },
  { key: "lastInteraction", shownByDefault: true },
  { key: "followUp", shownByDefault: true },
  { key: "role", shownByDefault: false },
  { key: "email", shownByDefault: false },
  { key: "phone", shownByDefault: false },
  { key: "linkedin", shownByDefault: false },
  { key: "openOpportunities", shownByDefault: false },
  { key: "createdAt", shownByDefault: false },
  { key: "actions", shownByDefault: true, lock: "last" },
] as const satisfies readonly LayoutCatalogueEntry[];

export type ContactColumnKey = (typeof CONTACT_COLUMNS)[number]["key"];

export const COMPANY_COLUMNS = [
  { key: "name", shownByDefault: true, lock: "first" },
  { key: "status", shownByDefault: true },
  { key: "accountOwner", shownByDefault: true },
  { key: "contacts", shownByDefault: true },
  { key: "activeVacancies", shownByDefault: true },
  {
    key: "openOpportunities",
    shownByDefault: true,
    requires: COMMERCIAL_ACCESS_CODES,
  },
  {
    key: "lastInteraction",
    shownByDefault: true,
    requires: COMMERCIAL_ACCESS_CODES,
  },
  { key: "totalVacancies", shownByDefault: false },
  {
    key: "openOpportunityFee",
    shownByDefault: false,
    requires: COMMERCIAL_ACCESS_CODES,
  },
  { key: "createdAt", shownByDefault: false },
  { key: "actions", shownByDefault: true, lock: "last" },
] as const satisfies readonly LayoutCatalogueEntry[];

export type CompanyColumnKey = (typeof COMPANY_COLUMNS)[number]["key"];

/** The whole Opportunities screen already needs commercial access. */
export const OPPORTUNITY_COLUMNS = [
  { key: "title", shownByDefault: true, lock: "first" },
  { key: "company", shownByDefault: true },
  { key: "estimatedFee", shownByDefault: true },
  { key: "nextStep", shownByDefault: true },
  { key: "owner", shownByDefault: true },
  { key: "lastInteraction", shownByDefault: true },
  { key: "stage", shownByDefault: true },
  { key: "closeDate", shownByDefault: false },
  { key: "contacts", shownByDefault: false },
  { key: "linkedVacancies", shownByDefault: false },
  { key: "createdAt", shownByDefault: false },
  { key: "lostReason", shownByDefault: false },
] as const satisfies readonly LayoutCatalogueEntry[];

export type OpportunityColumnKey = (typeof OPPORTUNITY_COLUMNS)[number]["key"];
