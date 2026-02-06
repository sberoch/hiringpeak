import { CompanyFormSchema } from "@/components/companies/new-company.schema";
import { EditCompanyFormSchema } from "@/components/companies/edit-company.schema";
import { PaginatedResponse } from "@workspace/shared/types/api";
import { Company, CompanyParams } from "@workspace/shared/types/company";

import api from ".";
import { filtersToSearchParams } from "../utils";

export const COMPANIES_API_KEY = "company";

export async function getAllCompanies(params: CompanyParams) {
  const searchParams = filtersToSearchParams(params);
  const response = await api.get<PaginatedResponse<Company>>(
    `/company${searchParams}`
  );
  return response.data;
}

export async function getCompanyById(id: string) {
  const response = await api.get<Company>(`/company/${id}`);
  return response.data;
}

export async function createCompany(company: CompanyFormSchema) {
  const response = await api.post<Company>("/company", company);
  return response.data;
}

export async function updateCompany(
  id: string,
  company: EditCompanyFormSchema
) {
  const response = await api.patch<Company>(`/company/${id}`, company);
  return response.data;
}

export async function deleteCompany(id: string) {
  const response = await api.delete<Company>(`/company/${id}`);
  return response.data;
}
