"use client";

import { type ReactNode } from "react";
import { usePermissions } from "@/contexts/permission-context";

interface PermissionGuardProps {
  /** Require at least one of these permission codes to render children. */
  permissions: string[];
  children: ReactNode;
}

export function PermissionGuard({ permissions, children }: PermissionGuardProps) {
  const { hasAnyPermission, isLoading } = usePermissions();

  if (isLoading) return null;
  if (permissions.length === 0) return <>{children}</>;
  if (!hasAnyPermission(permissions)) return null;

  return <>{children}</>;
}
