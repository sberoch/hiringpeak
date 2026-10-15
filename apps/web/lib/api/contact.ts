import type {
  Contact,
  CreateContactDto,
  UpdateContactDto,
} from "@workspace/shared/types/contact";

import api from ".";

export const CONTACT_API_KEY = "contact";

export async function createContact(contact: CreateContactDto) {
  const response = await api.post<Contact>("/contact", contact);
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
