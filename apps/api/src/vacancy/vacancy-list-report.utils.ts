import { daysBetween } from './vacancy-report.utils';
import type {
  VacancyListReportDocumentData,
  VacancyListReportSourceRow,
  VacancyListReportStatusTally,
} from './vacancy-list-report.types';

export function buildVacancyListReportData(params: {
  generatedAt: Date;
  organizationName: string;
  appliedFilters: string[];
  rows: VacancyListReportSourceRow[];
}): VacancyListReportDocumentData {
  const rows = params.rows.map((row) => ({
    ...row,
    // close-or-today − created, clamped at 0 (Close Date is backdatable and
    // not range-validated, so it can legitimately precede createdAt).
    daysOpen: daysBetween(row.createdAt, row.closedAt ?? params.generatedAt),
  }));

  return {
    organizationName: params.organizationName,
    generatedAt: params.generatedAt,
    total: rows.length,
    statusTally: buildStatusTally(params.rows),
    appliedFilters: params.appliedFilters,
    rows,
  };
}

/** By-status tally preserving first-seen order (mirrors the list screen). */
export function buildStatusTally(
  rows: VacancyListReportSourceRow[],
): VacancyListReportStatusTally[] {
  const order: string[] = [];
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!counts.has(row.statusName)) {
      order.push(row.statusName);
    }
    counts.set(row.statusName, (counts.get(row.statusName) ?? 0) + 1);
  }
  return order.map((name) => ({ name, count: counts.get(name)! }));
}

export function buildVacancyListReportFileName(generatedAt: Date): string {
  const year = generatedAt.getFullYear();
  const month = `${generatedAt.getMonth() + 1}`.padStart(2, '0');
  const day = `${generatedAt.getDate()}`.padStart(2, '0');
  return `listado-vacantes-${year}-${month}-${day}.pdf`;
}
