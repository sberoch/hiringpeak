import { type Company } from '@workspace/shared/types/company';
import type { VacancyApiResponse } from '../vacancy/vacancy.service';
import {
  COMPANY_REPORT_DESCRIPTION_TRUNCATE_LENGTH,
  COMPANY_REPORT_HIRED_STATUS_NAME,
  COMPANY_REPORT_LOCALE,
} from './company-report.constants';
import type {
  CompanyReportDocumentData,
  CompanyReportHire,
  CompanyReportSummary,
  CompanyReportVacancyRow,
} from './company-report.types';

const dateFormatter = new Intl.DateTimeFormat(COMPANY_REPORT_LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formatReportDate(date?: Date | null): string {
  if (!date) {
    return '-';
  }
  return dateFormatter.format(date);
}

export function buildCompanyReportFileName(
  companyName: string,
  generatedAt: Date,
): string {
  const safeCompanyName = slugifyFileNameSegment(companyName || 'empresa');
  const fileDate = formatFileDate(generatedAt);
  return `reporte-empresa-${safeCompanyName}-${fileDate}.pdf`;
}

export function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function buildCompanyReportData(params: {
  company: Company;
  generatedAt: Date;
  organizationName: string;
  vacancies: VacancyApiResponse[];
}): CompanyReportDocumentData {
  const vacancyRows = sortVacancyRows(
    params.vacancies.map((vacancy) =>
      buildCompanyReportVacancyRow(vacancy, params.generatedAt),
    ),
  );
  const summary = buildCompanyReportSummary(vacancyRows);
  const hires = extractHires(params.vacancies);

  return {
    organizationName: params.organizationName,
    companyName: params.company.name,
    companyDescription: params.company.description?.trim() || undefined,
    contactInfo: {
      clientName: params.company.clientName?.trim() || undefined,
      clientEmail: params.company.clientEmail?.trim() || undefined,
      clientPhone: params.company.clientPhone?.trim() || undefined,
    },
    generatedAt: params.generatedAt,
    summary,
    hires,
    vacancies: vacancyRows,
  };
}

export function buildCompanyReportVacancyRow(
  vacancy: VacancyApiResponse,
  generatedAt: Date,
): CompanyReportVacancyRow {
  const isClosed = !!vacancy.closedAt;
  const closedAt = vacancy.closedAt ? new Date(vacancy.closedAt) : null;
  const createdAt = new Date(vacancy.createdAt);
  const daysOpen = isClosed && closedAt
    ? daysBetween(createdAt, closedAt)
    : daysBetween(createdAt, generatedAt);

  const totalCandidates = vacancy.candidates.length;
  const hiredCandidates = vacancy.candidates.filter(
    (cv) => cv.status?.name === COMPANY_REPORT_HIRED_STATUS_NAME,
  ).length;

  return {
    id: vacancy.id,
    title: vacancy.title,
    description: truncateDescription(vacancy.description),
    statusName: vacancy.status.name,
    isClosed,
    daysOpen,
    closedAt,
    totalCandidates,
    hiredCandidates,
    salary: vacancy.salary?.trim() || undefined,
  };
}

export function buildCompanyReportSummary(
  rows: CompanyReportVacancyRow[],
): CompanyReportSummary {
  const totalVacancies = rows.length;
  const activeRows = rows.filter((row) => !row.isClosed);
  const closedRows = rows.filter((row) => row.isClosed);
  const totalCandidates = rows.reduce(
    (sum, row) => sum + row.totalCandidates,
    0,
  );
  const hiredCandidates = rows.reduce(
    (sum, row) => sum + row.hiredCandidates,
    0,
  );
  const averageDaysOpen =
    activeRows.length > 0
      ? activeRows.reduce((sum, row) => sum + row.daysOpen, 0) /
        activeRows.length
      : 0;

  return {
    totalVacancies,
    activeVacancies: activeRows.length,
    closedVacancies: closedRows.length,
    totalCandidates,
    hiredCandidates,
    averageDaysOpen,
  };
}

export function extractHires(
  vacancies: VacancyApiResponse[],
): CompanyReportHire[] {
  const hires: CompanyReportHire[] = [];
  for (const vacancy of vacancies) {
    for (const cv of vacancy.candidates) {
      if (cv.status?.name === COMPANY_REPORT_HIRED_STATUS_NAME) {
        hires.push({
          candidateName: cv.candidate.name,
          vacancyTitle: vacancy.title,
        });
      }
    }
  }
  return hires.sort((a, b) =>
    a.candidateName.localeCompare(b.candidateName, COMPANY_REPORT_LOCALE),
  );
}

export function sortVacancyRows(
  rows: CompanyReportVacancyRow[],
): CompanyReportVacancyRow[] {
  return [...rows].sort((a, b) => {
    if (a.isClosed !== b.isClosed) {
      return a.isClosed ? 1 : -1;
    }
    if (!a.isClosed) {
      if (a.daysOpen !== b.daysOpen) {
        return b.daysOpen - a.daysOpen;
      }
      return b.id - a.id;
    }
    const aClosed = a.closedAt?.getTime() ?? 0;
    const bClosed = b.closedAt?.getTime() ?? 0;
    if (aClosed !== bClosed) {
      return bClosed - aClosed;
    }
    return b.id - a.id;
  });
}

function truncateDescription(value?: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length <= COMPANY_REPORT_DESCRIPTION_TRUNCATE_LENGTH) {
    return trimmed;
  }
  return `${trimmed.slice(0, COMPANY_REPORT_DESCRIPTION_TRUNCATE_LENGTH).trimEnd()}…`;
}

function slugifyFileNameSegment(value: string): string {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'empresa';
}

function formatFileDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}
