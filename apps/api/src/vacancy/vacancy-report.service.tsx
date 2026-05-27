import { Injectable } from '@nestjs/common';
import { renderToBuffer } from '@react-pdf/renderer';
import { OrganizationService } from '../organization/organization.service';
import { VacancyReportDocument } from './vacancy-report.document';
import { VacancyListReportDocument } from './vacancy-list-report.document';
import { registerVacancyReportFonts } from './vacancy-report.fonts';
import { VACANCY_REPORT_CONTENT_TYPE } from './vacancy-report.constants';
import type { VacancyReportFile } from './vacancy-report.types';
import {
  buildVacancyReportData,
  buildVacancyReportFileName,
} from './vacancy-report.utils';
import {
  buildVacancyListReportData,
  buildVacancyListReportFileName,
} from './vacancy-list-report.utils';
import { VacancyService } from './vacancy.service';
import type { VacancyListReportServiceParams } from './vacancy.dto';

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

  /**
   * Internal Vacancy List Report: every Vacancy matching the active filters
   * (unpaginated), one block per Vacancy. `appliedFilters` is the display-only
   * filter echo forwarded from the frontend.
   */
  async generateVacancyListReportPdf(
    params: VacancyListReportServiceParams,
  ): Promise<VacancyReportFile> {
    const generatedAt = new Date();

    const [organization, rows] = await Promise.all([
      this.organizationService.findOne(params.organizationId),
      this.vacancyService.findAllForListReport(params),
    ]);

    const report = buildVacancyListReportData({
      generatedAt,
      organizationName: organization.name,
      appliedFilters: params.appliedFilters ?? [],
      rows,
    });

    registerVacancyReportFonts();

    const buffer = await renderToBuffer(
      <VacancyListReportDocument report={report} />,
    );

    return {
      buffer,
      contentType: VACANCY_REPORT_CONTENT_TYPE,
      fileName: buildVacancyListReportFileName(generatedAt),
    };
  }
}
