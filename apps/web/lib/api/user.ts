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
