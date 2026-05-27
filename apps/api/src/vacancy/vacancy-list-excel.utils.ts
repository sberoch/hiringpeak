import ExcelJS from 'exceljs';
import type {
  VacancyListReportDocumentData,
  VacancyListReportRow,
} from './vacancy-list-report.types';
import {
  EXCEL_DATE_FORMAT,
  addKeyValueSheet,
  addTableSheet,
  createReportWorkbook,
  formatExcelDateTime,
  joinList,
  type ExcelColumn,
  type KeyValueSection,
} from '../common/excel/excel.utils';

/**
 * Excel rendering of the internal **Vacancy List Report** (see CONTEXT.md →
 * "Report Format"). Inherently one flat table — one row per Vacancy across the
 * filtered set — plus a `Resumen` sheet echoing the active filters and the
 * by-status tally. Mirrors the same filtered, unpaginated set as the PDF.
 */
export function buildVacancyListReportWorkbook(
  report: VacancyListReportDocumentData,
): ExcelJS.Workbook {
  const workbook = createReportWorkbook();

  addTableSheet(workbook, 'Vacantes', listColumns(), report.rows);

  const summarySections: KeyValueSection[] = [
    {
      title: 'Listado de vacantes',
      rows: [
        ['Organización', report.organizationName],
        ['Generado', formatExcelDateTime(report.generatedAt)],
        ['Total vacantes', report.total],
      ],
    },
    {
      title: 'Filtros aplicados',
      rows:
        report.appliedFilters.length > 0
          ? report.appliedFilters.map((filter) => ['Filtro', filter])
          : [['Filtros', 'Sin filtros']],
    },
    {
      title: 'Vacantes por estado',
      rows: report.statusTally.map((status) => [status.name, status.count]),
    },
  ];

  addKeyValueSheet(workbook, 'Resumen', summarySections);

  return workbook;
}

function listColumns(): ExcelColumn<VacancyListReportRow>[] {
  return [
    { header: 'Título', width: 30, value: (row) => row.title },
    { header: 'Empresa', width: 26, value: (row) => row.companyName },
    { header: 'Estado', width: 18, value: (row) => row.statusName },
    { header: 'Responsable', width: 22, value: (row) => row.ownerName },
    {
      header: 'Seniorities',
      width: 24,
      value: (row) => joinList(row.seniorities),
    },
    { header: 'Áreas', width: 24, value: (row) => joinList(row.areas) },
    { header: 'Industrias', width: 24, value: (row) => joinList(row.industries) },
    { header: 'Compensación', width: 18, value: (row) => row.salary },
    { header: 'Candidatos', width: 12, value: (row) => row.candidateCount },
    {
      header: 'Creada',
      width: 14,
      numFmt: EXCEL_DATE_FORMAT,
      value: (row) => row.createdAt,
    },
    {
      header: 'Cerrada',
      width: 14,
      numFmt: EXCEL_DATE_FORMAT,
      value: (row) => row.closedAt,
    },
    { header: 'Días abierta', width: 12, value: (row) => row.daysOpen },
  ];
}
