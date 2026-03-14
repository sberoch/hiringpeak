import type { PaginatedResponse } from "@workspace/shared/types/api";
import api from ".";
import { filtersToSearchParams } from "../utils";

export const PERMISSIONS_API_KEY = "permissions";

export type Permission = {
  id: number;
  code: string;
  label: string;
  description: string | null;
  createdAt: string | Date | null;
  updatedAt: string | Date | null;
};

export type PermissionParams = {
  page?: number;
  limit?: number;
  order?: string;
  code?: string;
  label?: string;
};

export async function getAllPermissions(
  params: PermissionParams
): Promise<PaginatedResponse<Permission>> {
  const searchParams = filtersToSearchParams(params);
  const response = await api.get<PaginatedResponse<Permission>>(
    `/permission${searchParams}`
  );
  return response.data;
}

export async function getPermissionById(id: number): Promise<Permission> {
  const response = await api.get<Permission>(`/permission/${id}`);
  return response.data;
}

export type UpdatePermissionData = {
  label?: string;
  description?: string | null;
};

export async function updatePermission(
  id: number,
  data: UpdatePermissionData
): Promise<Permission> {
  const response = await api.patch<Permission>(`/permission/${id}`, data);
  return response.data;
}
