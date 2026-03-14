import type { PaginatedResponse } from "@workspace/shared/types/api";
import api from ".";

export const ROLES_API_KEY = "roles";

export type Role = {
  id: number;
  organizationId: number | null;
  name: string;
  isSystem: boolean | null;
  createdAt: string | Date | null;
  updatedAt: string | Date | null;
  permissionIds?: number[];
};

export type RoleParams = {
  page?: number;
  limit?: number;
  order?: string;
  name?: string;
};

function toSearchParams(params: RoleParams): string {
  const sp = new URLSearchParams();
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.order) sp.set("order", params.order);
  if (params.name) sp.set("name", params.name);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export async function getAllRoles(
  params: RoleParams
): Promise<PaginatedResponse<Role>> {
  const res = await api.get<PaginatedResponse<Role>>(
    `/role${toSearchParams(params)}`
  );
  return res.data;
}

export async function getRoleById(id: number): Promise<Role> {
  const res = await api.get<Role>(`/role/${id}`);
  return res.data;
}
