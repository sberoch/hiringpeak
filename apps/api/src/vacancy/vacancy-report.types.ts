export interface VacancyReportSummary {
  totalCandidates: number;
  hiredCandidates: number;
  noProfileCandidates: number;
}

export interface VacancyReportCandidateRow {
  id: number;
  name: string;
  rejectionReason?: string;
  sourceName?: string;
  stars?: string;
  statusName: string;
  statusSort: number;
}

export interface VacancyReportMetadata {
  assignedToName: string;
  closedAt: Date | null;
  companyName: string;
  compensation?: string;
  createdAt: Date;
  generatedAt: Date;
  statusName: string;
  updatedAt: Date;
  vacancyTitle: string;
}

export interface VacancyReportProfile {
  ageRange?: string;
  areas: string[];
  countries: string[];
  gender?: string;
  industries: string[];
  languages: string[];
  minStars?: string;
  provinces: string[];
  seniorities: string[];
}

export interface VacancyReportDocumentData {
  candidates: VacancyReportCandidateRow[];
  description?: string;
  hiredCandidates: VacancyReportCandidateRow[];
  metadata: VacancyReportMetadata;
  organizationName: string;
  profile: VacancyReportProfile;
  summary: VacancyReportSummary;
}

export interface VacancyReportFile {
  buffer: Buffer;
  contentType: string;
  fileName: string;
}
