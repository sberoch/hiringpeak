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
}
