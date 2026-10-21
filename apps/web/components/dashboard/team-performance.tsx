"use client";

import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { useSession } from "next-auth/react";
import type { ReactNode } from "react";

import type {
  CommercialSummary,
  RecruiterStats,
} from "@workspace/shared/types/dashboard";
import { hasCommercialAccess } from "@workspace/shared/lib/commercial-access";
import { cn } from "@workspace/ui/lib/utils";

import { usePermissions } from "@/contexts/permission-context";
import {
  COMMERCIAL_SUMMARY_API_KEY,
  getCommercialSummary,
  getRecruiterStats,
  RECRUITER_STATS_API_KEY,
} from "@/lib/api/dashboard";
import { formatCompactMoney, getInitials } from "@/lib/utils";

import { buildTeamRows, seesWholeTeam } from "./team-rows";

const RECRUITING_BAND = "bg-electric/[0.04]";
const COMMERCIAL_BAND = "bg-violet-500/[0.05]";
const HEADER_CELL =
  "px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-brand";

/**
 * «Rendimiento del equipo»: one row per person for the current calendar year,
 * with a recruiting column group and, for users with commercial access, a
 * commercial one.
 */
export function TeamPerformanceTable() {
  const session = useSession();
  const currentUserId = Number(session.data?.userId ?? 0);
  const { permissionCodes } = usePermissions();
  const commercialAccess = hasCommercialAccess(permissionCodes);
  const recruiters = useQuery<RecruiterStats[]>({
    queryKey: [RECRUITER_STATS_API_KEY],
    queryFn: getRecruiterStats,
  });
  const commercial = useQuery<CommercialSummary>({
    queryKey: [COMMERCIAL_SUMMARY_API_KEY],
    queryFn: getCommercialSummary,
    enabled: commercialAccess,
  });

  const isLoading =
    recruiters.isLoading || (commercialAccess && commercial.isLoading);
  const rows = buildTeamRows(
    recruiters.data ?? [],
    commercialAccess ? (commercial.data?.owners ?? []) : [],
    { userId: currentUserId, permissionCodes },
  );

  return (
    <div className="rounded-2xl border border-brand-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric/10 text-electric">
            <Users className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold tracking-tight text-ink">
            {seesWholeTeam(permissionCodes)
              ? "Rendimiento del equipo"
              : "Tu rendimiento"}
          </h3>
        </div>
        <span className="text-[11px] font-medium text-muted-brand">
          {new Date().getFullYear()}
        </span>
      </div>

      {isLoading ? (
        <div className="divide-y divide-brand-border-light">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5">
              <div className="h-8 w-8 rounded-full bg-brand-border-light animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-28 rounded bg-brand-border-light animate-pulse" />
                <div className="h-3 w-40 rounded bg-brand-border-light animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-brand">
          <Users className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">Sin datos este año</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="bg-canvas/50" />
                <GroupHeader className={cn(RECRUITING_BAND, "text-electric")}>
                  Reclutamiento
                </GroupHeader>
                {commercialAccess && (
                  <GroupHeader
                    className={cn(COMMERCIAL_BAND, "text-violet-600")}
                  >
                    Comercial
                  </GroupHeader>
                )}
              </tr>
              <tr className="border-b border-brand-border-light">
                <th className={cn(HEADER_CELL, "bg-canvas/50 px-5 text-left")}>
                  Persona
                </th>
                <th className={cn(HEADER_CELL, RECRUITING_BAND)}>Activas</th>
                <th className={cn(HEADER_CELL, RECRUITING_BAND)}>Cobertura</th>
                <th className={cn(HEADER_CELL, RECRUITING_BAND)}>Tiempo</th>
                {commercialAccess && (
                  <>
                    <th className={cn(HEADER_CELL, COMMERCIAL_BAND)}>
                      Abiertas
                    </th>
                    <th className={cn(HEADER_CELL, COMMERCIAL_BAND)}>
                      En juego
                    </th>
                    <th className={cn(HEADER_CELL, COMMERCIAL_BAND)}>Cierre</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border-light">
              {rows.map(({ userId, name, recruiting, commercial }) => (
                <tr
                  key={userId}
                  className="transition-colors hover:bg-electric/[0.03]"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-electric/5 text-electric text-xs font-semibold flex-shrink-0">
                        {getInitials(name)}
                      </div>
                      <span className="text-sm font-semibold text-ink truncate">
                        {name}
                      </span>
                    </div>
                  </td>
                  <ValueCell>{recruiting?.activeVacancies}</ValueCell>
                  <ValueCell>
                    {recruiting && <RateBadge rate={recruiting.fillRate} />}
                  </ValueCell>
                  <ValueCell>
                    {recruiting?.avgTimeToFillDays != null && (
                      <>
                        {recruiting.avgTimeToFillDays}{" "}
                        <span className="text-xs text-muted-brand">días</span>
                      </>
                    )}
                  </ValueCell>
                  {commercialAccess && (
                    <>
                      <ValueCell>{commercial?.open}</ValueCell>
                      <ValueCell>
                        {commercial && formatCompactMoney(commercial.openFee)}
                      </ValueCell>
                      <ValueCell>
                        {commercial && (
                          <RateBadge rate={commercial.closeRate} />
                        )}
                      </ValueCell>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function GroupHeader({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return (
    <th
      colSpan={3}
      className={cn(
        "px-3 pt-2.5 pb-1.5 text-center text-[11px] font-bold uppercase tracking-wider",
        className,
      )}
    >
      {children}
    </th>
  );
}

/** Centered numeric cell; an empty value renders as a muted dash. */
function ValueCell({ children }: { children: ReactNode }) {
  const empty = children == null || children === false || children === "";
  return (
    <td className="px-3 py-3.5 text-center text-sm font-medium text-ink tabular-nums whitespace-nowrap">
      {empty ? <span className="text-xs text-muted-brand">—</span> : children}
    </td>
  );
}

function RateBadge({ rate }: { rate: number | null }) {
  if (rate == null) return <span className="text-xs text-muted-brand">—</span>;
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
        rate >= 70
          ? "bg-emerald-50 text-emerald-600"
          : rate >= 40
            ? "bg-amber-50 text-amber-600"
            : "bg-red-50 text-red-500"
      }`}
    >
      {rate}%
    </span>
  );
}
