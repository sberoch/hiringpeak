import { Injectable } from '@nestjs/common';
import { renderToBuffer } from '@react-pdf/renderer';
import { OrganizationService } from '../organization/organization.service';
import { VacancyService } from '../vacancy/vacancy.service';
import { CompanyService } from './company.service';
import { CompanyReportDocument } from './company-report.document';
import { registerCompanyReportFonts } from './company-report.fonts';
import { COMPANY_REPORT_CONTENT_TYPE } from './company-report.constants';
import type { CompanyReportFile } from './company-report.types';
import {
  buildCompanyReportData,
  buildCompanyReportFileName,
} from './company-report.utils';
import { buildCompanyReportWorkbook } from './company-excel.utils';
import {
  EXCEL_CONTENT_TYPE,
  workbookToBuffer,
} from '../common/excel/excel.utils';

@Injectable()
export class CompanyReportService {
  constructor(
    private readonly companyService: CompanyService,
    private readonly organizationService: OrganizationService,
    private readonly vacancyService: VacancyService,
  ) {}

  async generateCompanyReportPdf(
    companyId: number,
    organizationId: number,
  ): Promise<CompanyReportFile> {
    const generatedAt = new Date();

    const [organization, company, vacancies] = await Promise.all([
      this.organizationService.findOne(organizationId),
      this.companyService.findOne(companyId, organizationId),
      this.vacancyService.findAllByCompanyId(companyId, organizationId),
    ]);

    const report = buildCompanyReportData({
      company,
      generatedAt,
      organizationName: organization.name,
      vacancies,
    });

    registerCompanyReportFonts();

    const buffer = await renderToBuffer(
      <CompanyReportDocument report={report} />,
    );

    return {
      buffer,
      contentType: COMPANY_REPORT_CONTENT_TYPE,
      fileName: buildCompanyReportFileName(company.name, generatedAt),
    };
  }

  /**
   * Excel rendering of the Company Report — a deeper dump than the PDF: adds a
   * per-candidacy `Candidatos` sheet across all the Company's Vacancies, with
   * internal-only fields. Loads the full graph via `findAllByCompanyIdForReport`.
   */
  async generateCompanyReportXlsx(
    companyId: number,
    organizationId: number,
  ): Promise<CompanyReportFile> {
    const generatedAt = new Date();

    const [organization, company, vacancies] = await Promise.all([
      this.organizationService.findOne(organizationId),
      this.companyService.findOne(companyId, organizationId),
      this.vacancyService.findAllByCompanyIdForReport(companyId, organizationId),
    ]);

    const workbook = buildCompanyReportWorkbook({
      company,
      generatedAt,
      organizationName: organization.name,
      vacancies,
    });

    return {
      buffer: await workbookToBuffer(workbook),
      contentType: EXCEL_CONTENT_TYPE,
      fileName: buildCompanyReportFileName(company.name, generatedAt, 'xlsx'),
    };
  }
}
