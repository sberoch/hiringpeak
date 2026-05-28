import ExcelJS from 'exceljs';
import { type Company } from '@workspace/shared/types/company';
import type {
  ReportCandidacyRow,
  VacancyReportFullResponse,
} from '../vacancy/vacancy.service';
import { candidateColumns } from '../vacancy/vacancy-excel.utils';
import {
  EXCEL_DATE_FORMAT,
  addKeyValueSheet,
  addTableSheet,
  createReportWorkbook,
  formatExcelDateTime,
  type ExcelColumn,
  type KeyValueSection,
} from '../common/excel/excel.utils';
import { buildCompanyReportData } from './company-report.utils';
import type { CompanyReportVacancyRow } from './company-report.types';

/**
 * Excel rendering of the **Company Report** (see CONTEXT.md → "Report Format").
 * Three sheets: `Resumen` (company metadata + aggregates), `Vacantes` (one row
 * per Vacancy) and `Candidatos` — a per-candidacy dump across ALL the Company's
 * Vacancies that the PDF never surfaces (the Excel is a deeper dump). Internal
 * working artifact, not the client deliverable.
 */
export function buildCompanyReportWorkbook(params: {
  company: Company;
  generatedAt: Date;
  organizationName: string;
  vacancies: VacancyReportFullResponse[];
}): ExcelJS.Workbook {
  const { company, generatedAt, organizationName, vacancies } = params;
  const data = buildCompanyReportData({
    company,
    generatedAt,
    organizationName,
    vacancies,
  });

  const workbook = createReportWorkbook();

  const summarySections: KeyValueSection[] = [
    {
      title: 'Reporte de empresa',
      rows: [
        ['Organización', organizationName],
        ['Generado', formatExcelDateTime(generatedAt)],
        ['Empresa', data.companyName],
        ['Estado', company.status],
        ['Cliente', data.contactInfo.clientName],
        ['Email cliente', data.contactInfo.clientEmail],
        ['Teléfono cliente', data.contactInfo.clientPhone],
      ],
    },
    {
      title: 'Descripción',
      rows: [['Descripción', data.companyDescription]],
    },
    {
      title: 'Resumen',
      rows: [
        ['Total vacantes', data.summary.totalVacancies],
        ['Vacantes activas', data.summary.activeVacancies],
        ['Vacantes cerradas', data.summary.closedVacancies],
        ['Total candidatos', data.summary.totalCandidates],
        ['Contratados', data.summary.hiredCandidates],
        ['Promedio días abierta', Math.round(data.summary.averageDaysOpen)],
      ],
    },
    {
      title: 'Contrataciones',
      rows:
        data.hires.length > 0
          ? data.hires.map((hire) => [hire.candidateName, hire.vacancyTitle])
          : [['Sin contrataciones', '']],
    },
    {
      title: 'Motivos de rechazo',
      rows:
        data.rejectionBreakdown.length > 0
          ? data.rejectionBreakdown.map((reason) => [reason.name, reason.count])
          : [['Sin rechazos', 0]],
    },
  ];

  addKeyValueSheet(workbook, 'Resumen', summarySections);

  // `Vacantes`: reuse the PDF's computed/sorted per-Vacancy rows, enriched with
  // owner + created date + full (untruncated) description from the full graph.
  const vacancyById = new Map(vacancies.map((vacancy) => [vacancy.id, vacancy]));
  addTableSheet(
    workbook,
    'Vacantes',
    vacancyColumns(vacancyById),
    data.vacancies,
  );

  // `Candidatos`: every Candidacy across every Vacancy, prefixed with its
  // Vacancy — the deeper dump the PDF omits.
  const candidacyRows: CompanyCandidacyRow[] = vacancies.flatMap((vacancy) =>
    vacancy.candidates.map((candidacy) => ({
      vacancyTitle: vacancy.title,
      candidacy,
    })),
  );
  addTableSheet(workbook, 'Candidatos', companyCandidateColumns(), candidacyRows);

  return workbook;
}

function vacancyColumns(
  vacancyById: Map<number, VacancyReportFullResponse>,
): ExcelColumn<CompanyReportVacancyRow>[] {
  return [
    { header: 'Título', width: 30, value: (row) => row.title },
    { header: 'Estado', width: 18, value: (row) => row.statusName },
    {
      header: 'Asignado a',
      width: 22,
      value: (row) => vacancyById.get(row.id)?.assignedTo.name,
    },
    { header: '¿Cerrada?', width: 12, value: (row) => row.isClosed },
    {
      header: 'Creada',
      width: 14,
      numFmt: EXCEL_DATE_FORMAT,
      value: (row) => vacancyById.get(row.id)?.createdAt,
    },
    {
      header: 'Cerrada',
      width: 14,
      numFmt: EXCEL_DATE_FORMAT,
      value: (row) => row.closedAt,
    },
    { header: 'Días abierta', width: 12, value: (row) => row.daysOpen },
    { header: 'Total candidatos', width: 14, value: (row) => row.totalCandidates },
    { header: 'Contratados', width: 12, value: (row) => row.hiredCandidates },
    { header: 'Rechazados', width: 12, value: (row) => row.rejectedCandidates },
    { header: 'Compensación', width: 18, value: (row) => row.salary },
    {
      header: 'Descripción',
      width: 50,
      value: (row) => vacancyById.get(row.id)?.description,
    },
  ];
}

interface CompanyCandidacyRow {
  vacancyTitle: string;
  candidacy: ReportCandidacyRow;
}

/** Shared candidacy columns, prefixed with the Vacancy each candidacy belongs to. */
function companyCandidateColumns(): ExcelColumn<CompanyCandidacyRow>[] {
  return [
    { header: 'Vacante', width: 30, value: (row) => row.vacancyTitle },
    ...candidateColumns().map((column) => ({
      ...column,
      value: (row: CompanyCandidacyRow) => column.value(row.candidacy),
    })),
  ];
}
