import { PaginatedResponse } from "@workspace/shared/types/api";
import {
  ContactSource,
  ContactSourceParams,
  ContactSourceWithUsage,
  CreateContactSourceDto,
  UpdateContactSourceDto,
} from "@workspace/shared/types/contact-source";

import api from ".";
import { filtersToSearchParams } from "../utils";

export const CONTACT_SOURCE_API_KEY = "contactSource";

/** Every Contact Source, in their configured order. */
export const ALL_CONTACT_SOURCES = { order: "sort:asc", limit: 1e9, page: 1 };

export async function getContactSources(params: ContactSourceParams) {
  const searchParams = filtersToSearchParams(params);
  const response = await api.get<PaginatedResponse<ContactSourceWithUsage>>(
    `/contactSource${searchParams}`,
  );
  return response.data;
}

export async function createContactSource(source: CreateContactSourceDto) {
  const response = await api.post<ContactSource>("/contactSource", source);
  return response.data;
}

export async function updateContactSource(
  id: ContactSource["id"],
  source: UpdateContactSourceDto,
) {
  const response = await api.patch<ContactSource>(
    `/contactSource/${id}`,
    source,
  );
  return response.data;
}

export async function deleteContactSource(id: ContactSource["id"]) {
  const response = await api.delete(`/contactSource/${id}`);
  return response.data;
}
