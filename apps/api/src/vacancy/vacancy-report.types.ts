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
  candidates: VacancyReportCandidateRow[];
  description?: string;
  hiredCandidates: VacancyReportCandidateRow[];
  metadata: VacancyReportMetadata;
  organizationName: string;
  statusCounts: VacancyReportStatusCount[];
  summary: VacancyReportSummary;
}

export interface VacancyReportFile {
  buffer: Buffer;
  contentType: string;
  fileName: string;
}
