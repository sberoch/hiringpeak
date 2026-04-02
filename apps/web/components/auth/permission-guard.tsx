"use client";

import { type ReactNode } from "react";
import { usePermissions } from "@/contexts/permission-context";
import type { PermissionCode } from "@workspace/shared/enums";

interface PermissionGuardProps {
  /** Require at least one of these permission codes to render children. */
  permissions: PermissionCode[];
  children: ReactNode;
}

export function PermissionGuard({ permissions, children }: PermissionGuardProps) {
  const { hasAnyPermission, isLoading } = usePermissions();

  if (isLoading) return null;
  if (permissions.length === 0) return <>{children}</>;
  if (!hasAnyPermission(permissions)) return null;

  return <>{children}</>;
}
