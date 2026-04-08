export interface CompanyReportContactInfo {
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
}

export interface CompanyReportVacancyRow {
  id: number;
  title: string;
  statusName: string;
  peopleCount: number;
  cancelledCount: number;
  cancellationRate: number;
  estimatedAmount: number;
}

export interface CompanyReportSummary {
  totalVacancies: number;
  totalPeople: number;
  totalCancelledPeople: number;
  averagePeoplePerVacancy: number;
  globalCancellationRate: number;
  totalEstimatedAmount: number;
}

export interface CompanyReportDocumentData {
  organizationName: string;
  companyName: string;
  generatedAt: Date;
  contactInfo: CompanyReportContactInfo;
  summary: CompanyReportSummary;
  vacancies: CompanyReportVacancyRow[];
}

export interface CompanyReportFile {
  buffer: Buffer;
  contentType: string;
  fileName: string;
}
