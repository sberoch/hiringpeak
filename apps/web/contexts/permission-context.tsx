"use client";

import { getMePermissions } from "@/lib/api/auth";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { PermissionCode } from "@workspace/shared/enums";

const PERMISSIONS_QUERY_KEY = ["auth", "me", "permissions"];
const STALE_TIME_MS = 5 * 60 * 1000; // 5 minutes

type PermissionContextValue = {
  permissionCodes: PermissionCode[];
  roleName: string | null;
  isLoading: boolean;
  hasPermission: (code: PermissionCode) => boolean;
  hasAnyPermission: (codes: PermissionCode[]) => boolean;
  refetch: () => void;
};

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const accessToken =
    status === "authenticated" ? session?.accessToken : undefined;

  const {
    data,
    isLoading: queryLoading,
    refetch,
  } = useQuery({
    queryKey: PERMISSIONS_QUERY_KEY,
    queryFn: () => getMePermissions(accessToken as string),
    enabled: Boolean(accessToken),
    staleTime: STALE_TIME_MS,
  });

  const permissionCodes: PermissionCode[] = data?.permissionCodes ?? [];
  const roleName = data?.roleName ?? null;
  const isLoading = status === "loading" || (Boolean(accessToken) && queryLoading);

  const hasPermission = useCallback(
    (code: PermissionCode) => permissionCodes.includes(code),
    [permissionCodes]
  );

  const hasAnyPermission = useCallback(
    (codes: PermissionCode[]) => codes.some((c) => permissionCodes.includes(c)),
    [permissionCodes]
  );

  const value = useMemo<PermissionContextValue>(
    () => ({
      permissionCodes,
      roleName,
      isLoading,
      hasPermission,
      hasAnyPermission,
      refetch,
    }),
    [
      permissionCodes,
      roleName,
      isLoading,
      hasPermission,
      hasAnyPermission,
      refetch,
    ]
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionContext);
  if (!ctx) {
    throw new Error("usePermissions must be used within PermissionProvider");
  }
  return ctx;
}
