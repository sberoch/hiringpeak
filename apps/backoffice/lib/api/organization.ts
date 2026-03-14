import type { PaginatedResponse } from "@workspace/shared/types/api";
import type { Organization } from "@workspace/shared/schemas";

import api from ".";
import { filtersToSearchParams } from "../utils";

export const ORGANIZATIONS_API_KEY = "organizations";

export type OrganizationParams = {
  page?: number;
  limit?: number;
  order?: string;
  name?: string;
};

export async function getAllOrganizations(params: OrganizationParams) {
  const searchParams = filtersToSearchParams(params);
  const response = await api.get<PaginatedResponse<Organization>>(
    `/organization${searchParams}`
  );
  return response.data;
}

export type CreateOrganizationData = { name: string };

export async function createOrganization(data: CreateOrganizationData) {
  const response = await api.post<Organization>("/organization", data);
  return response.data;
}

export type OrganizationDetailUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean | null;
  createdAt: string | Date | null;
  lastLogin: string | Date | null;
};

export type OrganizationDetail = Organization & {
  users: OrganizationDetailUser[];
};

export async function getOrganizationDetail(id: number) {
  const response = await api.get<OrganizationDetail>(
    `/organization/${id}/detail`
  );
  return response.data;
}

export type OnboardOrganizationData = {
  organizationName: string;
  email: string;
  password: string;
  name: string;
};

export type OnboardOrganizationResponse = {
  organization: Organization;
  user: Omit<import("@workspace/shared/schemas").User, "password">;
};

export async function onboardOrganization(data: OnboardOrganizationData) {
  const response = await api.post<OnboardOrganizationResponse>(
    "/onboard/organization",
    data
  );
  return response.data;
}
