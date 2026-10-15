"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import { COMPANIES_API_KEY, getAllCompanies } from "@/lib/api/company";
import {
  ALL_CONTACT_SOURCES,
  CONTACT_SOURCE_API_KEY,
  getContactSources,
} from "@/lib/api/contact-source";
import {
  COMMERCIAL_USERS_API_KEY,
  getCommercialUsers,
} from "@/lib/api/opportunity";

const ALL_COMPANIES = { limit: 1e9, page: 1, order: "name:asc" } as const;

/** Contact Sources ("Origen"), in their configured order. */
export function useContactSources() {
  const { data } = useQuery({
    queryKey: [CONTACT_SOURCE_API_KEY, ALL_CONTACT_SOURCES],
    queryFn: () => getContactSources(ALL_CONTACT_SOURCES),
  });
  return data?.items ?? [];
}

/** Users with commercial access: the only valid Contact Owners. */
export function useCommercialUsers() {
  const { data } = useQuery({
    queryKey: [COMMERCIAL_USERS_API_KEY],
    queryFn: getCommercialUsers,
  });
  return data ?? [];
}

/** The signed-in user's id, or null while the session loads. */
export function useCurrentUserId() {
  const session = useSession();
  return session.data?.userId ? parseInt(session.data.userId, 10) : null;
}

/** Every Company of the Organization, by name. */
export function useCompanyOptions() {
  const { data } = useQuery({
    queryKey: [COMPANIES_API_KEY, ALL_COMPANIES],
    queryFn: () => getAllCompanies(ALL_COMPANIES),
  });
  return (data?.items ?? []).map((company) => ({
    id: company.id,
    name: company.name,
  }));
}
