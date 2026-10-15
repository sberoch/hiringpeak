import { EditUserFormSchema } from "@/components/users/edit-user.schema";
import { UserFormSchema } from "@/components/users/new-user.schema";
import { PaginatedResponse } from "@workspace/shared/types/api";
import { User, UserParams } from "@workspace/shared/types/user";

import api from ".";
import { filtersToSearchParams } from "../utils";

export const USERS_API_KEY = "user";

export async function getAllUsers(params: UserParams) {
  const searchParams = filtersToSearchParams(params);
  const response = await api.get<PaginatedResponse<User>>(
    `/user${searchParams}`
  );
  return response.data;
}

/** A user who can own commercial records (has CRM_READ or CRM_MANAGE). */
export type CommercialUser = { id: number; name: string; email: string };

/** Users with commercial access: the only valid owners of commercial records. */
export async function getCommercialUsers() {
  const response = await api.get<CommercialUser[]>("/user/commercial");
  return response.data;
}

export async function getUserById(id: string) {
  const response = await api.get<User>(`/user/${id}`);
  return response.data;
}

export async function createUser(user: UserFormSchema) {
  const response = await api.post<User>("/user", user);
  return response.data;
}

export async function updateUser(id: string, user: EditUserFormSchema) {
  if (user.password === "") {
    delete user.password;
  }
  const response = await api.patch<User>(`/user/${id}`, user);
  return response.data;
}

export async function deleteUser(id: string) {
  const response = await api.delete<User>(`/user/${id}`);
  return response.data;
}
