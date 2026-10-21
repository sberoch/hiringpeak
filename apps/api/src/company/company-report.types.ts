import type { ReportAccent, ReportBrand } from '../common/reports/report-brand';

export interface CompanyReportVacancyRow {
  id: number;
  title: string;
  description?: string;
  statusName: string;
  isClosed: boolean;
  daysOpen: number;
  closedAt: Date | null;
  totalCandidates: number;
  hiredCandidates: number;
  rejectedCandidates: number;
  salary?: string;
  /** Client-facing: the Vacancy Contact by name and role, never email or phone. */
  vacancyContact?: CompanyReportVacancyContact;
}

export interface CompanyReportVacancyContact {
  name: string;
  role: string;
}

export interface CompanyReportRejectionCount {
  name: string;
  count: number;
}

export interface CompanyReportHire {
  candidateName: string;
  vacancyTitle: string;
}

export interface CompanyReportSummary {
  totalVacancies: number;
  activeVacancies: number;
  closedVacancies: number;
  totalCandidates: number;
  hiredCandidates: number;
  averageDaysOpen: number;
}

export interface CompanyReportDocumentData {
  /** Header mark: the Organization's logo, or its name as a wordmark. */
  brand: ReportBrand;
  /** The Organization's accent color (or the default blue) and its text color. */
  accent: ReportAccent;
  organizationName: string;
  companyName: string;
  companyDescription?: string;
  generatedAt: Date;
  summary: CompanyReportSummary;
  hires: CompanyReportHire[];
  rejectionBreakdown: CompanyReportRejectionCount[];
  vacancies: CompanyReportVacancyRow[];
}

export interface CompanyReportFile {
  buffer: Buffer;
  contentType: string;
  fileName: string;
}
