/**
 * Vacancy List Report — an INTERNAL PDF listing of Vacancies across the
 * Organization, scoped by the active list-screen filters. Distinct from the
 * client-facing per-Vacancy Vacancy Report / per-Company Company Report: it
 * spans Companies and may surface internal data. See CONTEXT.md → "Vacancy
 * List Report". One block per Vacancy; never the per-Vacancy shortlist.
 */

/** Lean per-Vacancy projection produced by the service (no candidacy graph). */
export interface VacancyListReportSourceRow {
  id: number;
  title: string;
  companyName: string;
  statusName: string;
  ownerName: string;
  /** vacancies.salary — nullable free text. */
  salary: string | null;
  /** Search Brief facets (all optional). */
  seniorities: string[];
  areas: string[];
  industries: string[];
  /** Count of Candidacies (Pipeline size, excluding deleted candidates). */
  candidateCount: number;
  createdAt: Date;
  /** Backdatable, not range-validated → days-open clamps at 0. */
  closedAt: Date | null;
}

/** A row as rendered in the document (source row + derived days-open). */
export interface VacancyListReportRow extends VacancyListReportSourceRow {
  daysOpen: number;
}

export interface VacancyListReportStatusTally {
  name: string;
  count: number;
}

export interface VacancyListReportDocumentData {
  organizationName: string;
  generatedAt: Date;
  /** Total Vacancies in the filtered set (== rows.length). */
  total: number;
  /** By-status tally across the filtered set, first-seen order. */
  statusTally: VacancyListReportStatusTally[];
  /** Display-only, human-readable echo of the active filters. */
  appliedFilters: string[];
  rows: VacancyListReportRow[];
}
