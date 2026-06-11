import { EditVacancySchema } from "@/components/vacancies/edit-vacancy.schema";
import { CreateVacancySchema } from "@/components/vacancies/new-vacancy.schema";
import { PaginatedResponse } from "@workspace/shared/types/api";
import {
  Vacancy,
  VacancyListItem,
  VacancyParams,
} from "@workspace/shared/types/vacancy";

import api from ".";
import {
  DownloadableFile,
  getFileNameFromContentDisposition,
} from "../download";
import { filtersToSearchParams } from "../utils";

export const VACANCY_API_KEY = "vacancy";

export interface VacancyReportDownload extends DownloadableFile {}

export async function getAllVacancies(params: VacancyParams) {
  const searchParams = filtersToSearchParams(params);
  const response = await api.get<PaginatedResponse<VacancyListItem>>(
    `/vacancy${searchParams}`
  );
  return response.data;
}

export async function getVacancyById(id: string) {
  const response = await api.get<Vacancy>(`/vacancy/${id}`);
  return response.data;
}

export async function downloadVacancyReportPdf(
  id: string
): Promise<VacancyReportDownload> {
  const response = await api.get<Blob>(`/vacancy/${id}/report/pdf`, {
    responseType: "blob",
  });

  return {
    blob: response.data,
    fileName:
      getFileNameFromContentDisposition(response.headers["content-disposition"]) ||
      `reporte-vacante-${id}.pdf`,
  };
}

export async function downloadVacancyReportXlsx(
  id: string
): Promise<VacancyReportDownload> {
  const response = await api.get<Blob>(`/vacancy/${id}/report/xlsx`, {
    responseType: "blob",
  });

  return {
    blob: response.data,
    fileName:
      getFileNameFromContentDisposition(response.headers["content-disposition"]) ||
      `reporte-vacante-${id}.xlsx`,
  };
}

/**
 * Downloads the internal Vacancy List Report PDF for the active filters.
 * `params` carries the same filter IDs as the list query (pagination is ignored
 * server-side); `appliedFilters` are display-only labels for the report's echo.
 */
export async function downloadVacancyListReportPdf(
  params: VacancyParams,
  appliedFilters: string[]
): Promise<VacancyReportDownload> {
  const searchParams = filtersToSearchParams({ ...params, appliedFilters });
  const response = await api.get<Blob>(`/vacancy/report/pdf${searchParams}`, {
    responseType: "blob",
  });

  return {
    blob: response.data,
    fileName:
      getFileNameFromContentDisposition(response.headers["content-disposition"]) ||
      "listado-vacantes.pdf",
  };
}

/** Excel variant of the Vacancy List Report — same filters/echo as the PDF. */
export async function downloadVacancyListReportXlsx(
  params: VacancyParams,
  appliedFilters: string[]
): Promise<VacancyReportDownload> {
  const searchParams = filtersToSearchParams({ ...params, appliedFilters });
  const response = await api.get<Blob>(`/vacancy/report/xlsx${searchParams}`, {
    responseType: "blob",
  });

  return {
    blob: response.data,
    fileName:
      getFileNameFromContentDisposition(response.headers["content-disposition"]) ||
      "listado-vacantes.xlsx",
  };
}

export async function createVacancy(vacancy: CreateVacancySchema) {
  const response = await api.post<Vacancy>("/vacancy", vacancy);
  return response.data;
}

export async function updateVacancy(id: string, vacancy: EditVacancySchema) {
  const response = await api.patch<Vacancy>(`/vacancy/${id}`, vacancy);
  return response.data;
}

export async function closeVacancy(
  id: string,
  payload: { statusId: number; closedAt: string }
) {
  const response = await api.post<Vacancy>(`/vacancy/${id}/close`, payload);
  return response.data;
}

export async function reopenVacancy(id: string, statusId?: number) {
  const response = await api.post<Vacancy>(`/vacancy/${id}/reopen`, {
    statusId,
  });
  return response.data;
}

export async function deleteVacancy(id: string) {
  const response = await api.delete(`/vacancy/${id}`);
  return response.data;
}
