import type { VacancyApiResponse } from './vacancy.service';
import {
  VACANCY_REPORT_HIRED_STATUS_NAME,
  VACANCY_REPORT_LOCALE,
  VACANCY_REPORT_NO_PROFILE_STATUS_NAME,
} from './vacancy-report.constants';
import type {
  VacancyReportCandidateRow,
  VacancyReportDocumentData,
  VacancyReportProfile,
  VacancyReportSummary,
} from './vacancy-report.types';

const dateFormatter = new Intl.DateTimeFormat(VACANCY_REPORT_LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const starsFormatter = new Intl.NumberFormat(VACANCY_REPORT_LOCALE, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
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
      updatedAt: params.vacancy.updatedAt,
      vacancyTitle: params.vacancy.title,
    },
    organizationName: params.organizationName,
    profile: buildVacancyReportProfile(params.vacancy),
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

function buildVacancyReportCandidateRow(
  candidateVacancy: VacancyApiResponse['candidates'][number],
): VacancyReportCandidateRow {
  return {
    id: candidateVacancy.id,
    name: candidateVacancy.candidate.name,
    rejectionReason: isNoProfileCandidateStatus(candidateVacancy.status.name)
      ? candidateVacancy.rejectionReason || undefined
      : undefined,
    sourceName: candidateVacancy.candidate.source?.name || undefined,
    stars: formatCandidateStars(candidateVacancy.candidate.stars),
    statusName: candidateVacancy.status.name,
    statusSort: candidateVacancy.status.sort,
  };
}

function buildVacancyReportProfile(
  vacancy: VacancyApiResponse,
): VacancyReportProfile {
  const filters = vacancy.filters;

  if (!filters) {
    return {
      areas: [],
      countries: [],
      industries: [],
      languages: [],
      provinces: [],
      seniorities: [],
    };
  }

  return {
    ageRange: formatAgeRange(filters.minAge, filters.maxAge),
    areas: filters.areas.map((area) => area.name),
    countries: filters.countries ?? [],
    gender: translateGender(filters.gender),
    industries: filters.industries.map((industry) => industry.name),
    languages: filters.languages ?? [],
    minStars: formatCandidateStars(filters.minStars),
    provinces: filters.provinces ?? [],
    seniorities: filters.seniorities.map((seniority) => seniority.name),
  };
}

function buildVacancyReportSummary(
  candidates: VacancyReportCandidateRow[],
): VacancyReportSummary {
  return {
    totalCandidates: candidates.length,
    hiredCandidates: candidates.filter((candidate) =>
      isHiredCandidateStatus(candidate.statusName),
    ).length,
    noProfileCandidates: candidates.filter((candidate) =>
      isNoProfileCandidateStatus(candidate.statusName),
    ).length,
  };
}

function formatAgeRange(
  minAge?: number | null,
  maxAge?: number | null,
): string | undefined {
  if (minAge == null && maxAge == null) {
    return undefined;
  }

  if (minAge != null && maxAge != null) {
    return `${minAge} - ${maxAge} años`;
  }

  if (minAge != null) {
    return `Desde ${minAge} años`;
  }

  return `Hasta ${maxAge} años`;
}

function formatCandidateStars(stars?: string | number | null): string | undefined {
  if (stars == null || stars === '') {
    return undefined;
  }

  const parsedStars =
    typeof stars === 'number' ? stars : Number.parseFloat(stars);

  if (!Number.isFinite(parsedStars)) {
    return undefined;
  }

  return starsFormatter.format(parsedStars);
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

function translateGender(gender?: string | null): string | undefined {
  if (!gender || gender === 'none') {
    return undefined;
  }

  if (gender === 'male') {
    return 'Masculino';
  }

  if (gender === 'female') {
    return 'Femenino';
  }

  if (gender === 'other') {
    return 'Otro';
  }

  return gender;
}
