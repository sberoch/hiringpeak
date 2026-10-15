"use client";

import { Lock } from "lucide-react";
import type { ReactNode } from "react";

import { usePermissions } from "@/contexts/permission-context";
import { PermissionCode } from "@workspace/shared/enums";
import { hasCommercialAccess } from "@workspace/shared/lib/commercial-access";
import { LoadingSpinner } from "@workspace/ui/components/loading-spinner";

/** Commercial access and whether the user may change commercial records. */
export function useCommercialAccess() {
  const { permissionCodes, hasPermission, isLoading } = usePermissions();
  return {
    isLoading,
    canRead: hasCommercialAccess(permissionCodes),
    canManage: hasPermission(PermissionCode.CRM_MANAGE),
  };
}

/** Renders children only for users with commercial access. */
export function CommercialOnly({ children }: { children: ReactNode }) {
  const { isLoading, canRead } = useCommercialAccess();
  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }
  if (canRead) return <>{children}</>;
  return (
    <div className="mx-auto mt-24 max-w-md rounded-2xl border border-brand-border bg-surface p-8 text-center">
      <Lock className="mx-auto h-6 w-6 text-muted-brand" />
      <p className="mt-3 text-lg font-bold text-ink">Sin acceso</p>
      <p className="mt-1 text-sm text-slate-brand">
        Esta sección es parte del área comercial.
      </p>
    </div>
  );
}
