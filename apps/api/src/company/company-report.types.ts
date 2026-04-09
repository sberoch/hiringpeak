export interface CompanyReportContactInfo {
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
}

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
  salary?: string;
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
  organizationName: string;
  companyName: string;
  companyDescription?: string;
  contactInfo: CompanyReportContactInfo;
  generatedAt: Date;
  summary: CompanyReportSummary;
  hires: CompanyReportHire[];
  vacancies: CompanyReportVacancyRow[];
}

export interface CompanyReportFile {
  buffer: Buffer;
  contentType: string;
  fileName: string;
}
