import type { PaginatedResponse } from "@workspace/shared/types/api";
import type {
  Contact,
  ContactDuplicate,
  ContactDuplicatesProbe,
  ContactFilters,
  CreateContactDto,
  CreatedContact,
  NetworkContact,
  UpdateContactDto,
} from "@workspace/shared/types/contact";

import api from ".";
import { filtersToSearchParams } from "../utils";

export const CONTACT_API_KEY = "contact";

/** The Organization's network (commercial access only). */
export async function getContacts(params: ContactFilters) {
  const searchParams = filtersToSearchParams(params);
  const response = await api.get<PaginatedResponse<NetworkContact>>(
    `/contact${searchParams}`,
  );
  return response.data;
}

export async function getContactById(id: number) {
  const response = await api.get<NetworkContact>(`/contact/${id}`);
  return response.data;
}

/** Probable duplicates of a Contact being typed in (a warning only). */
export async function getContactDuplicates(probe: ContactDuplicatesProbe) {
  const searchParams = filtersToSearchParams(probe);
  const response = await api.get<ContactDuplicate[]>(
    `/contact/duplicates${searchParams}`,
  );
  return response.data;
}

/** Creates the Contact; the response carries its probable duplicates. */
export async function createContact(contact: CreateContactDto) {
  const response = await api.post<CreatedContact>("/contact", contact);
  return response.data;
}

export async function updateContact(id: number, contact: UpdateContactDto) {
  const response = await api.patch<Contact>(`/contact/${id}`, contact);
  return response.data;
}

export async function deleteContact(id: number) {
  const response = await api.delete<Contact>(`/contact/${id}`);
  return response.data;
}
