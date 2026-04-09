import type { VacancyApiResponse } from './vacancy.service';
import {
  VACANCY_REPORT_HIRED_STATUS_NAME,
  VACANCY_REPORT_LOCALE,
  VACANCY_REPORT_NO_PROFILE_STATUS_NAME,
} from './vacancy-report.constants';
import type {
  VacancyReportCandidateRow,
  VacancyReportDocumentData,
  VacancyReportStatusCount,
  VacancyReportSummary,
} from './vacancy-report.types';

const dateFormatter = new Intl.DateTimeFormat(VACANCY_REPORT_LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function buildVacancyReportFileName(
  vacancyTitle: string,
  generatedAt: Date,
): string {
  const safeVacancyTitle = slugifyFileNameSegment(vacancyTitle || 'vacante');
  const fileDate = formatFileDate(generatedAt);
  return `reporte-vacante-${safeVacancyTitle}-${fileDate}.pdf`;
}

export function buildVacancyReportData(params: {
  generatedAt: Date;
  organizationName: string;
  vacancy: VacancyApiResponse;
}): VacancyReportDocumentData {
  const candidates = params.vacancy.candidates
    .map((candidateVacancy) => buildVacancyReportCandidateRow(candidateVacancy))
    .sort(sortCandidatesByStatusAndName);

  const hiredCandidates = candidates
    .filter((candidate) => isHiredCandidateStatus(candidate.statusName))
    .sort((a, b) => a.name.localeCompare(b.name, VACANCY_REPORT_LOCALE));

  return {
    candidates,
    description: params.vacancy.description || undefined,
    hiredCandidates,
    metadata: {
      assignedToName: params.vacancy.assignedTo.name,
      closedAt: params.vacancy.closedAt,
      companyName: params.vacancy.company.name,
      compensation: params.vacancy.salary || undefined,
      createdAt: params.vacancy.createdAt,
      generatedAt: params.generatedAt,
      statusName: params.vacancy.status.name,
      vacancyTitle: params.vacancy.title,
    },
    organizationName: params.organizationName,
    statusCounts: buildStatusCounts(candidates),
    summary: buildVacancyReportSummary(candidates),
  };
}

export function formatReportDate(date?: Date | null): string {
  if (!date) {
    return '-';
  }

  return dateFormatter.format(date);
}

export function isHiredCandidateStatus(statusName?: string): boolean {
  return statusName === VACANCY_REPORT_HIRED_STATUS_NAME;
}

export function isNoProfileCandidateStatus(statusName?: string): boolean {
  return statusName === VACANCY_REPORT_NO_PROFILE_STATUS_NAME;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

type CandidateWithCategories =
  VacancyApiResponse['candidates'][number]['candidate'] & {
    seniorities?: Array<{ name: string }>;
    areas?: Array<{ name: string }>;
    industries?: Array<{ name: string }>;
  };

function buildVacancyReportCandidateRow(
  candidateVacancy: VacancyApiResponse['candidates'][number],
): VacancyReportCandidateRow {
  const candidate = candidateVacancy.candidate as CandidateWithCategories;
  return {
    id: candidateVacancy.id,
    name: candidate.name,
    image: parseHttpImage(candidate.image),
    shortDescription: candidate.shortDescription?.trim() || undefined,
    statusName: candidateVacancy.status.name,
    statusSort: candidateVacancy.status.sort,
    starsValue: parseStarsValue(candidate.stars),
    seniorities: (candidate.seniorities ?? []).map((s) => s.name),
    areas: (candidate.areas ?? []).map((a) => a.name),
    industries: (candidate.industries ?? []).map((i) => i.name),
  };
}

function buildStatusCounts(
  candidates: VacancyReportCandidateRow[],
): VacancyReportStatusCount[] {
  const map = new Map<string, VacancyReportStatusCount>();
  for (const candidate of candidates) {
    const existing = map.get(candidate.statusName);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(candidate.statusName, {
        name: candidate.statusName,
        count: 1,
        sort: candidate.statusSort,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.sort - b.sort);
}

function buildVacancyReportSummary(
  candidates: VacancyReportCandidateRow[],
): VacancyReportSummary {
  return {
    totalCandidates: candidates.length,
    hiredCandidates: candidates.filter((candidate) =>
      isHiredCandidateStatus(candidate.statusName),
    ).length,
  };
}

function parseStarsValue(
  stars?: string | number | null,
): number | undefined {
  if (stars == null || stars === '') {
    return undefined;
  }
  const parsed = typeof stars === 'number' ? stars : Number.parseFloat(stars);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseHttpImage(image?: string | null): string | undefined {
  if (!image) return undefined;
  const trimmed = image.trim();
  if (!/^https?:\/\//i.test(trimmed)) return undefined;
  return trimmed;
}

function formatFileDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function slugifyFileNameSegment(value: string): string {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'vacante';
}

function sortCandidatesByStatusAndName(
  left: VacancyReportCandidateRow,
  right: VacancyReportCandidateRow,
): number {
  if (left.statusSort !== right.statusSort) {
    return left.statusSort - right.statusSort;
  }

  return left.name.localeCompare(right.name, VACANCY_REPORT_LOCALE);
}
