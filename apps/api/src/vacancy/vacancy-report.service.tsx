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
import { buildVacancyReportWorkbook } from './vacancy-excel.utils';
import { buildVacancyListReportWorkbook } from './vacancy-list-excel.utils';
import {
  EXCEL_CONTENT_TYPE,
  workbookToBuffer,
} from '../common/excel/excel.utils';

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

  /**
   * Excel rendering of the Vacancy Report — the dense, internal "workable"
   * dump (full candidate roster incl. internal-only fields). Same data source
   * as the PDF but via `findOneForReport` (loads Blacklist + Comments).
   */
  async generateVacancyReportXlsx(
    vacancyId: number,
    organizationId: number,
  ): Promise<VacancyReportFile> {
    const generatedAt = new Date();

    const [organization, vacancy] = await Promise.all([
      this.organizationService.findOne(organizationId),
      this.vacancyService.findOneForReport(vacancyId, organizationId),
    ]);

    const workbook = buildVacancyReportWorkbook({
      generatedAt,
      organizationName: organization.name,
      vacancy,
    });

    return {
      buffer: await workbookToBuffer(workbook),
      contentType: EXCEL_CONTENT_TYPE,
      fileName: buildVacancyReportFileName(vacancy.title, generatedAt, 'xlsx'),
    };
  }

  /** Excel rendering of the internal Vacancy List Report (filtered, unpaginated). */
  async generateVacancyListReportXlsx(
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

    const workbook = buildVacancyListReportWorkbook(report);

    return {
      buffer: await workbookToBuffer(workbook),
      contentType: EXCEL_CONTENT_TYPE,
      fileName: buildVacancyListReportFileName(generatedAt, 'xlsx'),
    };
  }
}
