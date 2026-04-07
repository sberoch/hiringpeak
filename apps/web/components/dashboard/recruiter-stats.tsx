"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  Clock,
  Percent,
  TrendingUp,
  Users,
  UserCheck,
} from "lucide-react";

import type { RecruiterStats } from "@workspace/shared/types/dashboard";
import {
  getRecruiterStats,
  RECRUITER_STATS_API_KEY,
} from "@/lib/api/dashboard";
import { getInitials } from "@/lib/utils";

interface RecruiterStatsTableProps {
  currentUserId: number;
  isManager: boolean;
}

export function RecruiterStatsTable({
  currentUserId,
  isManager,
}: RecruiterStatsTableProps) {
  const { data, isLoading } = useQuery<RecruiterStats[]>({
    queryKey: [RECRUITER_STATS_API_KEY],
    queryFn: getRecruiterStats,
  });

  const stats = data ?? [];
  const visibleStats = isManager
    ? stats
    : stats.filter((s) => s.userId === currentUserId);

  return (
    <div className="rounded-2xl border border-brand-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric/10 text-electric">
            <UserCheck className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold tracking-tight text-ink">
            Rendimiento por reclutador
          </h3>
        </div>
        <span className="text-[11px] font-medium text-muted-brand">
          {new Date().getFullYear()}
        </span>
      </div>

      {/* Table */}
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
      ) : visibleStats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-brand">
          <Users className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">Sin datos de reclutadores</p>
        </div>
      ) : (
        <>
          {/* Column headers */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_repeat(5,_minmax(0,_auto))] items-center gap-3 px-5 py-2.5 border-b border-brand-border-light bg-canvas/50">
            <span className="text-[11px] font-semibold text-muted-brand uppercase tracking-wider">
              Reclutador
            </span>
            <span className="text-[11px] font-semibold text-muted-brand uppercase tracking-wider text-center w-20">
              Activas
            </span>
            <span className="text-[11px] font-semibold text-muted-brand uppercase tracking-wider text-center w-20">
              Total
            </span>
            <span className="text-[11px] font-semibold text-muted-brand uppercase tracking-wider text-center w-24">
              Cobertura
            </span>
            <span className="text-[11px] font-semibold text-muted-brand uppercase tracking-wider text-center w-24">
              Candidatos
            </span>
            <span className="text-[11px] font-semibold text-muted-brand uppercase tracking-wider text-center w-28">
              Tiempo prom.
            </span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-brand-border-light">
            {visibleStats.map((recruiter) => (
              <div
                key={recruiter.userId}
                className="grid grid-cols-1 sm:grid-cols-[1fr_repeat(5,_minmax(0,_auto))] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-electric/[0.03]"
              >
                {/* Recruiter name */}
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-electric/5 text-electric text-xs font-semibold flex-shrink-0">
                    {getInitials(recruiter.name)}
                  </div>
                  <span className="text-sm font-semibold text-ink truncate">
                    {recruiter.name}
                  </span>
                </div>

                {/* Mobile: metrics in a grid; Desktop: individual cells */}
                <div className="sm:contents grid grid-cols-3 gap-2 mt-2 sm:mt-0">
                  {/* Active vacancies */}
                  <div className="flex sm:justify-center items-center gap-1.5 w-20">
                    <Briefcase className="h-3 w-3 text-electric sm:hidden" />
                    <span className="text-sm font-medium text-ink tabular-nums">
                      {recruiter.activeVacancies}
                    </span>
                  </div>

                  {/* Total vacancies */}
                  <div className="flex sm:justify-center items-center gap-1.5 w-20">
                    <TrendingUp className="h-3 w-3 text-slate-brand sm:hidden" />
                    <span className="text-sm font-medium text-ink tabular-nums">
                      {recruiter.totalVacancies}
                    </span>
                  </div>

                  {/* Fill rate */}
                  <div className="flex sm:justify-center items-center gap-1.5 w-24">
                    <Percent className="h-3 w-3 text-teal sm:hidden" />
                    {recruiter.fillRate != null ? (
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                          recruiter.fillRate >= 70
                            ? "bg-emerald-50 text-emerald-600"
                            : recruiter.fillRate >= 40
                              ? "bg-amber-50 text-amber-600"
                              : "bg-red-50 text-red-500"
                        }`}
                      >
                        {recruiter.fillRate}%
                      </span>
                    ) : (
                      <span className="text-xs text-muted-brand">—</span>
                    )}
                  </div>

                  {/* Candidates in pipeline */}
                  <div className="flex sm:justify-center items-center gap-1.5 w-24">
                    <Users className="h-3 w-3 text-electric sm:hidden" />
                    <span className="text-sm font-medium text-ink tabular-nums">
                      {recruiter.candidatesInPipeline}
                    </span>
                  </div>

                  {/* Avg time to fill */}
                  <div className="flex sm:justify-center items-center gap-1.5 w-28">
                    <Clock className="h-3 w-3 text-muted-brand sm:hidden" />
                    {recruiter.avgTimeToFillDays != null ? (
                      <span className="text-sm font-medium text-ink tabular-nums">
                        {recruiter.avgTimeToFillDays}{" "}
                        <span className="text-xs text-muted-brand">días</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-brand">—</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
