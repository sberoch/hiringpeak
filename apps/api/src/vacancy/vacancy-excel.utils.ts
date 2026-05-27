import ExcelJS from 'exceljs';
import type {
  ReportCandidacyRow,
  VacancyReportFullResponse,
} from './vacancy.service';
import { buildVacancyReportData } from './vacancy-report.utils';
import {
  EXCEL_DATE_FORMAT,
  addKeyValueSheet,
  addTableSheet,
  createReportWorkbook,
  formatExcelDate,
  formatExcelDateTime,
  joinList,
  type ExcelColumn,
  type KeyValueSection,
} from '../common/excel/excel.utils';

/**
 * Excel rendering of the **Vacancy Report** (see CONTEXT.md → "Report Format").
 * Two sheets: `Resumen` (metadata + aggregate tables, reusing the PDF's view
 * model) and `Candidatos` (the full per-candidacy dump — every column,
 * including the internal-only Rejection Note, Blacklist and Comments the PDF
 * omits). This is the internal "workable" rendering, not the client deliverable.
 */
export function buildVacancyReportWorkbook(params: {
  generatedAt: Date;
  organizationName: string;
  vacancy: VacancyReportFullResponse;
}): ExcelJS.Workbook {
  const { generatedAt, organizationName, vacancy } = params;
  const data = buildVacancyReportData({
    generatedAt,
    organizationName,
    vacancy,
  });

  const workbook = createReportWorkbook();

  const summarySections: KeyValueSection[] = [
    {
      title: 'Reporte de vacante',
      rows: [
        ['Organización', organizationName],
        ['Generado', formatExcelDateTime(generatedAt)],
        ['Título', data.metadata.vacancyTitle],
        ['Empresa', data.metadata.companyName],
        ['Estado', data.metadata.statusName],
        ['Asignado a', data.metadata.assignedToName],
        ['Compensación', data.metadata.compensation],
        ['Creada', formatExcelDate(data.metadata.createdAt)],
        ['Cerrada', formatExcelDate(data.metadata.closedAt)],
      ],
    },
    {
      title: 'Descripción',
      rows: [['Descripción', data.description]],
    },
    {
      title: 'Resumen de candidatos',
      rows: [
        ['Total candidatos', data.summary.totalCandidates],
        ['Contratados', data.summary.hiredCandidates],
      ],
    },
    {
      title: 'Candidatos por estado',
      rows: data.statusCounts.map((status) => [status.name, status.count]),
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
  addTableSheet(workbook, 'Candidatos', candidateColumns(), vacancy.candidates);

  return workbook;
}

/**
 * The full candidacy column set, shared with the Company Report's cross-vacancy
 * `Candidatos` sheet. Internal-only fields (Rejection Note, Comments, Blacklist)
 * are included by design.
 */
export function candidateColumns(): ExcelColumn<ReportCandidacyRow>[] {
  return [
    { header: 'Nombre', width: 28, value: (cv) => cv.candidate.name },
    {
      header: 'Estrellas',
      width: 10,
      value: (cv) => parseStars(cv.candidate.stars),
    },
    { header: 'Estado', width: 22, value: (cv) => cv.status.name },
    { header: '¿Rechazado?', width: 12, value: (cv) => cv.status.isRejection },
    {
      header: 'Motivo de rechazo',
      width: 24,
      value: (cv) => cv.rejectionReason?.name,
    },
    {
      header: 'Nota de rechazo',
      width: 32,
      value: (cv) => cv.rejectionNote,
    },
    { header: 'Notas (candidatura)', width: 32, value: (cv) => cv.notes },
    { header: 'Email', width: 26, value: (cv) => cv.candidate.email },
    { header: 'Teléfono', width: 16, value: (cv) => cv.candidate.phone },
    { header: 'LinkedIn', width: 30, value: (cv) => cv.candidate.linkedin },
    { header: 'Dirección', width: 28, value: (cv) => cv.candidate.address },
    {
      header: 'Fecha de nacimiento',
      width: 16,
      value: (cv) => formatExcelDate(cv.candidate.dateOfBirth),
    },
    { header: 'Género', width: 12, value: (cv) => cv.candidate.gender },
    { header: 'Fuente', width: 18, value: (cv) => cv.candidate.source?.name },
    {
      header: 'Seniorities',
      width: 24,
      value: (cv) => joinList(cv.candidate.seniorities.map((s) => s.name)),
    },
    {
      header: 'Áreas',
      width: 24,
      value: (cv) => joinList(cv.candidate.areas.map((a) => a.name)),
    },
    {
      header: 'Industrias',
      width: 24,
      value: (cv) => joinList(cv.candidate.industries.map((i) => i.name)),
    },
    {
      header: 'Países',
      width: 20,
      value: (cv) => joinList(cv.candidate.countries),
    },
    {
      header: 'Provincias',
      width: 20,
      value: (cv) => joinList(cv.candidate.provinces),
    },
    {
      header: 'Idiomas',
      width: 20,
      value: (cv) => joinList(cv.candidate.languages),
    },
    {
      header: 'Descripción',
      width: 40,
      value: (cv) => cv.candidate.shortDescription,
    },
    {
      header: '¿En lista negra?',
      width: 14,
      value: (cv) => Boolean(cv.candidate.blacklist),
    },
    {
      header: 'Motivo lista negra',
      width: 30,
      value: (cv) => cv.candidate.blacklist?.reason,
    },
    {
      header: 'Comentarios',
      width: 50,
      value: (cv) => formatComments(cv.candidate.comments),
    },
    {
      header: 'Agregado',
      width: 14,
      numFmt: EXCEL_DATE_FORMAT,
      value: (cv) => cv.createdAt,
    },
  ];
}

function parseStars(stars?: string | number | null): number | null {
  if (stars == null || stars === '') return null;
  const parsed = typeof stars === 'number' ? stars : Number.parseFloat(stars);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Concatenate Comments with author + date provenance, one per line. */
function formatComments(
  comments: ReportCandidacyRow['candidate']['comments'],
): string | null {
  if (!comments || comments.length === 0) return null;
  return comments
    .map((comment) => {
      const author = comment.user?.name ?? 'Desconocido';
      const date = formatExcelDate(comment.createdAt) ?? '';
      return `[${author}${date ? ` · ${date}` : ''}] ${comment.comment}`;
    })
    .join('\n');
}
