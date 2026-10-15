"use client";

import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";

import { usePermissions } from "@/contexts/permission-context";
import {
  COMMERCIAL_USERS_API_KEY,
  getCommercialUsers,
  getLostReasons,
  getOpportunityStages,
  LOST_REASON_API_KEY,
  OPPORTUNITY_STAGE_API_KEY,
} from "@/lib/api/opportunity";
import { PermissionCode } from "@workspace/shared/enums";
import { hasCommercialAccess } from "@workspace/shared/lib/commercial-access";
import { sortOpportunityStages } from "@workspace/shared/lib/opportunity-stage";
import type { OpportunityStage } from "@workspace/shared/types/opportunity";
import { LoadingSpinner } from "@workspace/ui/components/loading-spinner";
import { cn } from "@workspace/ui/lib/utils";

dayjs.locale("es");

export const opportunityHref = (id: number) => `/opportunities/${id}`;

/** `YYYY-MM-DD` → "15 oct 2026". */
export function formatDay(isoDay: string): string {
  return dayjs(isoDay).format("D MMM YYYY");
}

/** Parses "18.500.000" / "18500000,5" into a number; empty → null; invalid → NaN. */
export function parseMoneyInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return Number(trimmed.replace(/\./g, "").replace(",", "."));
}

export function stageTone(stage: Pick<OpportunityStage, "isWon" | "isLost">) {
  if (stage.isWon) {
    return {
      dot: "bg-emerald-500",
      text: "text-emerald-700",
      bg: "bg-emerald-50",
    };
  }
  if (stage.isLost) {
    return { dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-100" };
  }
  return {
    dot: "bg-electric",
    text: "text-electric",
    bg: "bg-electric/[0.06]",
  };
}

export function StageBadge({
  stage,
  className,
}: {
  stage: OpportunityStage;
  className?: string;
}) {
  const tone = stageTone(stage);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-semibold",
        tone.bg,
        tone.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
      {stage.name}
    </span>
  );
}

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

/** Stages sorted for display (open by sort, then won, then lost). */
export function useOpportunityStages() {
  const query = useQuery({
    queryKey: [OPPORTUNITY_STAGE_API_KEY],
    queryFn: getOpportunityStages,
  });
  return {
    ...query,
    data: query.data ? sortOpportunityStages(query.data) : undefined,
  };
}

export function useLostReasons() {
  return useQuery({
    queryKey: [LOST_REASON_API_KEY],
    queryFn: getLostReasons,
  });
}

export function useCommercialUsers() {
  return useQuery({
    queryKey: [COMMERCIAL_USERS_API_KEY],
    queryFn: getCommercialUsers,
  });
}

/** Axios error message from the API, else the fallback. */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const message = (err as { response?: { data?: { message?: unknown } } })
    ?.response?.data?.message;
  return typeof message === "string" ? message : fallback;
}

/**
 * The preselected Opportunity Owner of a new Opportunity: the Company's
 * Account Owner, else the current user (each only with commercial access).
 * The API applies the same default when no owner is sent.
 */
export function defaultOpportunityOwnerId(
  accountOwnerId: number | null | undefined,
  me: number | null,
  commercialUsers: readonly { id: number }[],
): number | null {
  const isCommercial = (id: number | null | undefined): id is number =>
    id != null && commercialUsers.some((u) => u.id === id);
  if (isCommercial(accountOwnerId)) return accountOwnerId;
  return isCommercial(me) ? me : null;
}
