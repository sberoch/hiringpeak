import type { ReadableAccent } from '@workspace/shared/lib/accent-color';
import type { ReportBrand } from '../common/reports/report-brand';

export interface VacancyReportSummary {
  totalCandidates: number;
  hiredCandidates: number;
}

export interface VacancyReportCandidateRow {
  id: number;
  name: string;
  image?: string;
  shortDescription?: string;
  statusName: string;
  statusSort: number;
  isRejection: boolean;
  rejectionReasonName?: string;
  starsValue?: number;
  seniorities: string[];
  areas: string[];
  industries: string[];
}

export interface VacancyReportStatusCount {
  name: string;
  count: number;
  sort: number;
}

export interface VacancyReportRejectionCount {
  name: string;
  count: number;
}

export interface VacancyReportMetadata {
  assignedToName: string;
  closedAt: Date | null;
  companyName: string;
  compensation?: string;
  createdAt: Date;
  generatedAt: Date;
  statusName: string;
  vacancyTitle: string;
}

export interface VacancyReportDocumentData {
  /** Header mark: the Organization's logo, or its name as a wordmark. */
  brand: ReportBrand;
  /** The Organization's accent color (or the default blue) and its text color. */
  accent: ReadableAccent;
  candidates: VacancyReportCandidateRow[];
  description?: string;
  hiredCandidates: VacancyReportCandidateRow[];
  metadata: VacancyReportMetadata;
  organizationName: string;
  rejectionBreakdown: VacancyReportRejectionCount[];
  statusCounts: VacancyReportStatusCount[];
  summary: VacancyReportSummary;
}

export interface VacancyReportFile {
  buffer: Buffer;
  contentType: string;
  fileName: string;
}
