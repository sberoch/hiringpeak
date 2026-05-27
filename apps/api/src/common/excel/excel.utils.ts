import ExcelJS from 'exceljs';

/**
 * Shared helpers for the Excel **Report Format** (see CONTEXT.md → "Report
 * Format"). Unlike the PDF renderings — which prioritise styling for a
 * client-facing deliverable — the Excel renderings prioritise *completeness*:
 * dense, structured tables a recruiter can sort/filter/pivot. These helpers
 * give every report the same minimal "workable" chrome (a frozen, bold header
 * row + autofilter + sensible column widths) without trying to look pretty.
 */

export const EXCEL_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Values we know how to write as a typed cell; everything else is stringified. */
export type ExcelCellValue = string | number | boolean | Date | null | undefined;

export interface ExcelColumn<TRow> {
  header: string;
  /** Column width in Excel character units. Defaults to 20. */
  width?: number;
  /** Excel number format, e.g. 'dd/mm/yyyy' for Date columns. */
  numFmt?: string;
  value: (row: TRow) => ExcelCellValue;
}

/** Shared date format so every report renders dates the same way. */
export const EXCEL_DATE_FORMAT = 'dd/mm/yyyy';

export interface KeyValueSection {
  title: string;
  /** Each entry is a [label, value] pair rendered as two columns. */
  rows: Array<[string, ExcelCellValue]>;
}

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF1F5F9' }, // slate-100, neutral so the data reads first
};

export function createReportWorkbook(): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HiringPeak';
  workbook.created = new Date();
  return workbook;
}

/**
 * Render the workbook to a Node Buffer. `xlsx.writeBuffer()` resolves to an
 * ArrayBuffer-like value; wrap it so callers get a real Buffer for the HTTP
 * response.
 */
export async function workbookToBuffer(
  workbook: ExcelJS.Workbook,
): Promise<Buffer> {
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer as ArrayBuffer);
}

/**
 * Add a flat data table: one bold/frozen header row, one row per item, with
 * autofilter enabled across the header. Empty cells are left blank rather than
 * printing "-" so the sheet stays sortable/filterable.
 */
export function addTableSheet<TRow>(
  workbook: ExcelJS.Workbook,
  name: string,
  columns: ExcelColumn<TRow>[],
  rows: TRow[],
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet(name, {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = columns.map((column, index) => ({
    header: column.header,
    key: String(index),
    width: column.width ?? 20,
    ...(column.numFmt ? { style: { numFmt: column.numFmt } } : {}),
  }));

  styleHeaderRow(sheet);

  for (const row of rows) {
    sheet.addRow(columns.map((column) => normalizeCell(column.value(row))));
  }

  if (columns.length > 0) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columns.length },
    };
  }

  return sheet;
}

/**
 * Add a two-column "label / value" sheet built from labelled sections — used
 * for the per-report `Resumen` (metadata + small aggregate tables). Section
 * titles are bold; a blank row separates sections.
 */
export function addKeyValueSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  sections: KeyValueSection[],
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = [
    { key: 'label', width: 32 },
    { key: 'value', width: 60 },
  ];

  sections.forEach((section, index) => {
    if (index > 0) {
      sheet.addRow([]);
    }
    const titleRow = sheet.addRow([section.title]);
    titleRow.font = { bold: true, size: 12 };
    for (const [label, value] of section.rows) {
      const row = sheet.addRow([label, normalizeCell(value)]);
      row.getCell(1).font = { color: { argb: 'FF64748B' } }; // slate label
    }
  });

  return sheet;
}

const EXCEL_LOCALE = 'es-AR';

const dateFormatter = new Intl.DateTimeFormat(EXCEL_LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat(EXCEL_LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Format a Date (or `YYYY-MM-DD` string) as `dd/mm/yyyy`; null-safe. */
export function formatExcelDate(
  value?: Date | string | null,
): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return dateFormatter.format(date);
}

/** Format a Date as `dd/mm/yyyy HH:mm`; null-safe. Used for "generated at". */
export function formatExcelDateTime(value?: Date | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return dateTimeFormatter.format(date);
}

/** Join a list of names into one cell, dropping empties; null when nothing. */
export function joinList(
  values?: Array<string | null | undefined> | null,
): string | null {
  const cleaned = (values ?? [])
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
  return cleaned.length > 0 ? cleaned.join(', ') : null;
}

function styleHeaderRow(sheet: ExcelJS.Worksheet): void {
  const header = sheet.getRow(1);
  header.font = { bold: true };
  header.fill = HEADER_FILL;
  header.border = {
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  };
}

/**
 * Coerce a value into something ExcelJS will write as the right cell type.
 * `null`/`undefined`/empty become a blank cell; numbers and dates pass through
 * as typed cells (so the recruiter gets real numeric/date sorting).
 */
function normalizeCell(value: ExcelCellValue): string | number | Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No';
  }
  return value;
}
