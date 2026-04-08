import type { Company } from '@workspace/shared/types/company';
import type { VacancyApiResponse } from '../vacancy/vacancy.service';
import {
  CANCELLED_CANDIDATE_STATUS_NAMES,
  COMPANY_REPORT_AMOUNT_PER_VACANCY,
  COMPANY_REPORT_LOCALE,
} from './company-report.constants';
import type {
  CompanyReportDocumentData,
  CompanyReportSummary,
  CompanyReportVacancyRow,
} from './company-report.types';

const decimalFormatter = new Intl.NumberFormat(COMPANY_REPORT_LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat(COMPANY_REPORT_LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function isCancelledCandidateStatus(statusName?: string): boolean {
  if (!statusName) {
    return false;
  }

  return CANCELLED_CANDIDATE_STATUS_NAMES.includes(statusName);
}

export function formatReportDate(date: Date): string {
  return dateFormatter.format(date);
}

export function formatReportDecimal(value: number): string {
  return decimalFormatter.format(value);
}

export function formatReportCurrency(value: number): string {
  return `$ ${formatReportDecimal(value)}`;
}

export function formatReportPercentage(value: number): string {
  return `${formatReportDecimal(value)} %`;
}

export function buildCompanyReportFileName(
  companyName: string,
  generatedAt: Date,
): string {
  const safeCompanyName = slugifyFileNameSegment(companyName || 'empresa');
  const fileDate = formatFileDate(generatedAt);
  return `reporte-empresa-${safeCompanyName}-${fileDate}.pdf`;
}

export function buildCompanyReportData(params: {
  company: Company;
  generatedAt: Date;
  organizationName: string;
  vacancies: VacancyApiResponse[];
}): CompanyReportDocumentData {
  const vacancyRows = params.vacancies.map((vacancy) =>
    buildCompanyReportVacancyRow(vacancy),
  );
  const summary = buildCompanyReportSummary(vacancyRows);

  return {
    organizationName: params.organizationName,
    companyName: params.company.name,
    generatedAt: params.generatedAt,
    contactInfo: {
      clientName: params.company.clientName || undefined,
      clientEmail: params.company.clientEmail || undefined,
      clientPhone: params.company.clientPhone || undefined,
    },
    summary,
    vacancies: vacancyRows,
  };
}

function buildCompanyReportVacancyRow(
  vacancy: VacancyApiResponse,
): CompanyReportVacancyRow {
  const peopleCount = vacancy.candidates.length;
  const cancelledCount = vacancy.candidates.filter((candidateVacancy) =>
    isCancelledCandidateStatus(candidateVacancy.status?.name),
  ).length;

  return {
    id: vacancy.id,
    title: vacancy.title,
    statusName: vacancy.status.name,
    peopleCount,
    cancelledCount,
    cancellationRate:
      peopleCount > 0 ? (cancelledCount / peopleCount) * 100 : 0,
    estimatedAmount: COMPANY_REPORT_AMOUNT_PER_VACANCY,
  };
}

function buildCompanyReportSummary(
  vacancies: CompanyReportVacancyRow[],
): CompanyReportSummary {
  const totalVacancies = vacancies.length;
  const totalPeople = vacancies.reduce(
    (total, vacancy) => total + vacancy.peopleCount,
    0,
  );
  const totalCancelledPeople = vacancies.reduce(
    (total, vacancy) => total + vacancy.cancelledCount,
    0,
  );
  const totalEstimatedAmount = vacancies.reduce(
    (total, vacancy) => total + vacancy.estimatedAmount,
    0,
  );

  return {
    totalVacancies,
    totalPeople,
    totalCancelledPeople,
    averagePeoplePerVacancy:
      totalVacancies > 0 ? totalPeople / totalVacancies : 0,
    globalCancellationRate:
      totalPeople > 0 ? (totalCancelledPeople / totalPeople) * 100 : 0,
    totalEstimatedAmount,
  };
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
