import { Injectable } from '@nestjs/common';
import { renderToBuffer } from '@react-pdf/renderer';
import { OrganizationService } from '../organization/organization.service';
import { VacancyReportDocument } from './vacancy-report.document';
import { registerVacancyReportFonts } from './vacancy-report.fonts';
import { VACANCY_REPORT_CONTENT_TYPE } from './vacancy-report.constants';
import type { VacancyReportFile } from './vacancy-report.types';
import {
  buildVacancyReportData,
  buildVacancyReportFileName,
} from './vacancy-report.utils';
import { VacancyService } from './vacancy.service';

@Injectable()
export class VacancyReportService {
  constructor(
    private readonly vacancyService: VacancyService,
    private readonly organizationService: OrganizationService,
  ) {}

  async generateVacancyReportPdf(
    vacancyId: number,
    organizationId: number,
  ): Promise<VacancyReportFile> {
    const generatedAt = new Date();

    const [organization, vacancy] = await Promise.all([
      this.organizationService.findOne(organizationId),
      this.vacancyService.findOne(vacancyId, organizationId),
    ]);

    const report = buildVacancyReportData({
      generatedAt,
      organizationName: organization.name,
      vacancy,
    });

    registerVacancyReportFonts();

    const buffer = await renderToBuffer(
      <VacancyReportDocument report={report} />,
    );

    return {
      buffer,
      contentType: VACANCY_REPORT_CONTENT_TYPE,
      fileName: buildVacancyReportFileName(vacancy.title, generatedAt),
    };
  }
}
